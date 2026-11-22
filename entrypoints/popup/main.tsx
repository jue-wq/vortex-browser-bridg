import { render } from "preact";
import { useEffect, useState } from "preact/hooks";
import { browser } from "wxt/browser";
import { ConnectionManager } from "../../src/transport/ConnectionManager";
import "./style.css";

const t=(key:string,fallback:string)=>(browser.i18n as unknown as {getMessage:(message:string)=>string}).getMessage(key)||fallback;

function browserName():"firefox"|"chrome"{return /firefox/i.test(navigator.userAgent)?"firefox":"chrome";}
function Popup(){
  const [connected,setConnected]=useState(false);
  const [ytdlpReady,setYtdlpReady]=useState(false);
  const [mediaCount,setMediaCount]=useState(0);
  const [page,setPage]=useState("");
  const [queues,setQueues]=useState<{id:string;name:string}[]>([]);
  const [queueId,setQueueId]=useState("");
  const [tasks,setTasks]=useState<{id:string;filename:string;status:string;downloaded_bytes:number;total_bytes:number}[]>([]);
  const androidFirefox=/firefox/i.test(navigator.userAgent)&&/android/i.test(navigator.userAgent);
  useEffect(()=>{
    let alive=true;
    void browser.tabs.query({active:true,currentWindow:true}).then(async tabs=>{
      const tab=tabs[0];setPage(tab?.url??"");
      const result=await browser.storage.session.get("vortex_media_by_tab");
      const media=(result.vortex_media_by_tab as {tabId:number}[]|undefined)??[];
      setMediaCount(media.filter(item=>item.tabId===tab?.id).length);
    });
    const connection=new ConnectionManager();
    let statusTimer:ReturnType<typeof setInterval>|undefined;
    const refreshTasks=async()=>{
      try{
        const result=await connection.request("task_status",{limit:8},3000);
        if(!alive)return;
        const received=Array.isArray(result.payload.tasks)?result.payload.tasks:[];
        setTasks(received.flatMap(item=>{
          if(!item||typeof item!=="object")return [];
          const value=item as {id?:unknown;filename?:unknown;status?:unknown;downloaded_bytes?:unknown;total_bytes?:unknown};
          if(typeof value.id!=="string"||typeof value.filename!=="string"||typeof value.status!=="string")return [];
          const downloaded=typeof value.downloaded_bytes==="number"&&Number.isFinite(value.downloaded_bytes)?value.downloaded_bytes:0;
          const total=typeof value.total_bytes==="number"&&Number.isFinite(value.total_bytes)?value.total_bytes:0;
          return [{id:value.id,filename:value.filename,status:value.status,downloaded_bytes:downloaded,total_bytes:total}];
        }));
      }catch{/* Keep the last known snapshot when the app is temporarily unavailable. */}
    };
    void connection.request("handshake",{ext_version:"0.2.0",browser:browserName(),capabilities:androidFirefox?["downloads","media-sniffer","batch","original-ublock-origin-external"]:["downloads","media-sniffer","batch","adblock"]})
      .then(response=>{
        if(!alive)return;
        setConnected(true);
        setYtdlpReady(response.payload.ytdlp_ready===true);
        const received=Array.isArray(response.payload.queues)?response.payload.queues:[];
        const valid=received.flatMap(item=>{
          if(!item||typeof item!=="object")return [];
          const value=item as {id?:unknown;name?:unknown};
          return typeof value.id==="string"&&typeof value.name==="string"&&value.id!=="default"?[{id:value.id,name:value.name}]:[];
        });
        setQueues(valid);
        void refreshTasks();
        statusTimer=setInterval(()=>void refreshTasks(),3000);
      }).catch(()=>{if(alive)setConnected(false);});
    return ()=>{alive=false;if(statusTimer!==undefined)clearInterval(statusTimer);connection.disconnect();};
  },[]);
  const extract=async()=>{
    if(!page||!isHttpUrl(page)||!ytdlpReady)return;
    await browser.runtime.sendMessage({type:"VORTEX_EXTRACT_PAGE",url:page,queueId:queueId||undefined});
  };
  const grab=async()=>browser.tabs.query({active:true,currentWindow:true}).then(tabs=>{
    const id=tabs[0]?.id;if(id!==undefined)return browser.tabs.sendMessage(id,{type:"VORTEX_SCAN_PAGE",queueId:queueId||undefined});
  });
  let hostname="No active page";try{if(page)hostname=new URL(page).hostname;}catch{}
  return <main>
    <header><div class="brand">Vortex<span>DM</span></div><div class={connected?"status on":"status"}>{connected?t("connected","Connected"):androidFirefox?t("configureLoopback","Configure VortexDM loopback"):t("localFiltersActive","Local filters active")}</div></header>
    <section class="card"><div class="muted">{t("currentPage","Current page").toUpperCase()}</div><div class="page">{hostname}</div><div class="row"><span>{t("detectedMedia","Detected media")}</span><strong>{mediaCount}</strong></div><button onClick={extract} disabled={!isHttpUrl(page)||!ytdlpReady}>{t("extractYtdlp","Extract with yt-dlp")}</button>{!ytdlpReady?<span class="muted">{t("configureYtdlpFirst","Configure an active yt-dlp profile in VortexDM first.")}</span>:null}</section>
    <section class="task-list"><div class="row"><strong>{t("recentDownloads","Recent downloads")}</strong><span>{tasks.length}</span></div>{tasks.length===0?<div class="muted">{t("noRecentDownloads","No recent downloads")}</div>:tasks.map(task=>{const percent=task.total_bytes>0?Math.min(100,Math.round(task.downloaded_bytes/task.total_bytes*100)):0;return <div class="task-item" key={task.id}><div class="task-title">{task.filename}</div><div class="task-meta"><span>{task.status}</span><span>{task.total_bytes>0?`${formatBytes(task.downloaded_bytes)} / ${formatBytes(task.total_bytes)}`:formatBytes(task.downloaded_bytes)}</span></div><div class="progress"><span style={{width:`${percent}%`}}/></div></div>;})}</section>
    <section class="privacy"><strong>{androidFirefox?t("originalUbo","Original uBlock Origin"):t("privacyEnabled","Privacy protection enabled")}</strong><span>{androidFirefox?t("uboDescription","Install the original Raymond Hill extension from Firefox Add-ons. Bridge filtering is disabled on Android."):t("desktopPrivacy","Ad and tracker rules run locally in this browser.")}</span>{androidFirefox?<a href="https://addons.mozilla.org/android/addon/ublock-origin/" target="_blank" rel="noreferrer">{t("getUbo","Get uBlock Origin")}</a>:null}</section>
    <section class="actions"><label class="queue">{t("queue","Queue")}<select value={queueId} onChange={event=>setQueueId(event.currentTarget.value)}><option value="">{t("defaultQueue","Default queue")}</option>{queues.map(queue=><option value={queue.id}>{queue.name}</option>)}</select></label><button class="secondary" onClick={grab}>{t("grabLinks","Grab page links")}</button><button class="secondary" onClick={()=>browser.runtime.openOptionsPage()}>{t("settings","Settings")}</button></section>
    <footer>{t("footer","Local-first · No analytics · Vortex Browser Bridge 0.2.0")}</footer>
  </main>;
}
function formatBytes(value:number):string{if(value<1024)return `${value} B`;const units=["KB","MB","GB","TB"];let size=value/1024;let index=0;while(size>=1024&&index<units.length-1){size/=1024;index++;}return `${size.toFixed(1)} ${units[index]}`;}
function isHttpUrl(value:string):boolean{try{return ["http:","https:"].includes(new URL(value).protocol);}catch{return false;}}
render(<Popup/>,document.getElementById("app")!);
