import { browser } from "wxt/browser";
import { ConnectionManager } from "../src/transport/ConnectionManager";
import { addBatchPayloadSchema, addDownloadPayloadSchema, extractMediaPayloadSchema } from "../src/protocol/schema";
import { decideCapture, defaultInterceptionSettings } from "../src/background/RuleEngine";
import { classifyMedia, deduplicateMedia, type DetectedMedia } from "../src/background/MediaSniffer";
import { detectYtDlpPage } from "../src/background/YtDlpDetector";
import { AdblockController } from "../src/adblock/AdblockController";

type DownloadSnapshot = {id:number;url:string;filename:string;totalBytes:number;incognito:boolean;referrer?:string};
type RawCookie = {name?:unknown;value?:unknown;domain?:unknown;path?:unknown;secure?:unknown;httpOnly?:unknown;expirationDate?:unknown};
const connection = new ConnectionManager();
const settings = {...defaultInterceptionSettings};
const interceptionKeys = ["captureEnabled","captureMinSizeBytes","captureExcludedDomains","captureAllowedDomains","captureIncludedExtensions","captureIncludedMimeTypes","captureIncognitoAllowed"];
function applyInterceptionSettings(saved:Record<string,unknown>):void {
  settings.enabled = saved.captureEnabled !== false;
  settings.minSizeBytes = typeof saved.captureMinSizeBytes === "number" && Number.isFinite(saved.captureMinSizeBytes) && saved.captureMinSizeBytes >= 0 ? saved.captureMinSizeBytes : 0;
  settings.excludedDomains = Array.isArray(saved.captureExcludedDomains) ? saved.captureExcludedDomains.filter((item):item is string=>typeof item==="string") : [];
  settings.allowedDomains = Array.isArray(saved.captureAllowedDomains) ? saved.captureAllowedDomains.filter((item):item is string=>typeof item==="string") : [];
  settings.includedExtensions = Array.isArray(saved.captureIncludedExtensions) ? saved.captureIncludedExtensions.filter((item):item is string=>typeof item==="string") : [];
  settings.includedMimeTypes = Array.isArray(saved.captureIncludedMimeTypes) ? saved.captureIncludedMimeTypes.filter((item):item is string=>typeof item==="string") : [];
  settings.incognitoAllowed = saved.captureIncognitoAllowed === true;
}
const adblock = new AdblockController();

export default defineBackground({
  persistent:false,
  main() {
    void adblock.start().catch(()=>undefined);
    void browser.storage.local.get(interceptionKeys).then(saved=>applyInterceptionSettings(saved));
    browser.storage.onChanged.addListener((changes,area)=>{
      if(area==="local" && interceptionKeys.some(key=>key in changes)) void browser.storage.local.get(interceptionKeys).then(saved=>applyInterceptionSettings(saved));
      if(area==="local" && (changes.vortexAdblockEnabled || changes.vortexCustomFilterRules)) void adblock.refresh().catch(()=>undefined);
    });
    browser.runtime.onInstalled.addListener(() => {
      void browser.contextMenus.removeAll().then(() => {
        browser.contextMenus.create({id:"vortex-download-link",title:"Download with VortexDM",contexts:["link"]});
        browser.contextMenus.create({id:"vortex-extract-page",title:"Extract page with yt-dlp",contexts:["page"]});
        browser.contextMenus.create({id:"vortex-grab-links",title:"Grab all page links",contexts:["page"]});
      });
    });

    const downloadsApi = (browser as unknown as {downloads?:{onCreated?:{addListener:(listener:(item:DownloadSnapshot)=>void)=>void};cancel:(id:number)=>Promise<void>;erase:(query:{id:number})=>Promise<number>}}).downloads;
    downloadsApi?.onCreated?.addListener(item=>{void interceptDownload(item);});

    browser.webRequest.onCompleted.addListener(details => {
      const kind=classifyMedia(details.url);
      if(!kind||details.tabId<0)return;
      void saveDetectedMedia({url:details.url,kind,tabId:details.tabId,seenAt:Date.now()});
    },{urls:["http://*/*","https://*/*"]});

    browser.tabs.onRemoved.addListener(tabId=>{
      void browser.storage.session.get("vortex_media_by_tab").then(state=>{
        const current=(state.vortex_media_by_tab as DetectedMedia[]|undefined)??[];
        return browser.storage.session.set({vortex_media_by_tab:current.filter(item=>item.tabId!==tabId)});
      });
    });

    browser.contextMenus.onClicked.addListener((info,tab)=>{
      if(tab?.id===undefined)return;
      if(info.menuItemId==="vortex-extract-page"&&tab.url) void sendExtract(tab.url,tab.title??"",[]);
      if(info.menuItemId==="vortex-grab-links") void browser.tabs.sendMessage(tab.id,{type:"VORTEX_SCAN_PAGE"});
      if(info.menuItemId==="vortex-download-link"&&info.linkUrl) void sendDownload(info.linkUrl,tab.url);
    });

    browser.runtime.onMessage.addListener((message:unknown,sender)=>{
      if(!message||typeof message!=="object"||!("type" in message))return;
      const value=message as {type:string;urls?:unknown;sourcePage?:string;url?:string;cookies?:unknown};
      if(value.type==="VORTEX_ENABLE_FULL_FILTERS"){
        return adblock.enableFullLists().then(
          ()=>({success:true}),
          error=>({success:false,message:error instanceof Error?error.message:"Filter list update failed"})
        );
      }
      if(value.type==="VORTEX_DISABLE_FULL_FILTERS"){
        return adblock.disableFullLists().then(
          ()=>({success:true}),
          error=>({success:false,message:error instanceof Error?error.message:"Could not disable filter lists"})
        );
      }
      if(value.type==="VORTEX_ADD_BATCH"&&Array.isArray(value.urls)){
        const urls=value.urls.filter((url):url is string=>typeof url==="string"&&isHttpUrl(url));
        const sourcePage=isHttpUrl(value.sourcePage??"")?value.sourcePage:sender.tab?.url;
        const candidate=addBatchPayloadSchema.safeParse({items:urls.map(url=>({url})),source_page:sourcePage});
        if(candidate.success) void connection.addBatch(candidate.data).catch(()=>undefined);
      }
      if(value.type==="VORTEX_ADD_DOWNLOAD"&&value.url) void sendDownload(value.url,sender.tab?.url);
      if(value.type==="VORTEX_EXTRACT_PAGE"&&value.url){
        const rawCookies=Array.isArray(value.cookies)?value.cookies as RawCookie[]:[];
        void sendExtract(value.url,sender.tab?.title??"",rawCookies);
      }
    });

    async function interceptDownload(item:DownloadSnapshot):Promise<void>{
      if(!settings.enabled)return;
      const decision=decideCapture({url:item.url,filename:item.filename,totalBytes:item.totalBytes,incognito:item.incognito},settings);
      if(!decision.capture||!item.url)return;
      const candidate=addDownloadPayloadSchema.safeParse({
        url:item.url,headers:{},cookies:[],auto_start:true,
        ...(item.filename?{filename:item.filename}:{}),
        ...(item.referrer&&isHttpUrl(item.referrer)?{referrer:item.referrer,download_page:item.referrer}:{})
      });
      if(!candidate.success)return;
      try{
        const response=await connection.request("add_download",candidate.data,1500);
        if(response.payload.accepted===true){
          await downloadsApi?.cancel(item.id);
          await downloadsApi?.erase({id:item.id});
        }
      }catch{
        // Safe fallback: no acknowledgement means browser download remains untouched.
      }
    }

    async function sendDownload(url:string,page?:string):Promise<void>{
      if(!isHttpUrl(url))return;
      const payload=addDownloadPayloadSchema.safeParse({url,headers:{},cookies:[],auto_start:true,...(page&&isHttpUrl(page)?{download_page:page}:{})});
      if(payload.success)await connection.request("add_download",payload.data).catch(()=>undefined);
    }

    async function sendExtract(url:string,title:string,rawCookies:RawCookie[]):Promise<void>{
      if(!isHttpUrl(url))return;
      const cookies=rawCookies.flatMap(cookie=>{
        if(typeof cookie.name!=="string"||typeof cookie.value!=="string"||typeof cookie.domain!=="string")return [];
        return [{name:cookie.name,value:cookie.value,domain:cookie.domain,path:typeof cookie.path==="string"?cookie.path:"/",secure:cookie.secure===true,http_only:cookie.httpOnly===true,...(typeof cookie.expirationDate==="number"?{expires:cookie.expirationDate}:{})}];
      });
      const parsed=extractMediaPayloadSchema.safeParse({webpage_url:url,page_title:title,user_agent:navigator.userAgent,cookies,playlist_mode:detectYtDlpPage(url).playlist?"ask":"single"});
      if(parsed.success)await connection.request("extract_media",parsed.data).catch(()=>undefined);
    }

    async function saveDetectedMedia(item:DetectedMedia):Promise<void>{
      const state=await browser.storage.session.get("vortex_media_by_tab");
      const current=(state.vortex_media_by_tab as DetectedMedia[]|undefined)??[];
      const recent=current.filter(media=>media.tabId!==item.tabId||Date.now()-media.seenAt<30*60_000);
      await browser.storage.session.set({vortex_media_by_tab:deduplicateMedia([...recent,item])});
    }
  }
});

function isHttpUrl(value:string):boolean{
  try{return ["http:","https:"].includes(new URL(value).protocol);}catch{return false;}
}
