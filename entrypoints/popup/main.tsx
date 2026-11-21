import { render } from "preact";
import { useEffect, useState } from "preact/hooks";
import { browser } from "wxt/browser";
import { ConnectionManager } from "../../src/transport/ConnectionManager";
import "./style.css";

function browserName():"firefox"|"chrome"{return /firefox/i.test(navigator.userAgent)?"firefox":"chrome";}
function Popup(){
  const [connected,setConnected]=useState(false);
  const [mediaCount,setMediaCount]=useState(0);
  const [page,setPage]=useState("");
  useEffect(()=>{
    let alive=true;
    void browser.tabs.query({active:true,currentWindow:true}).then(async tabs=>{
      const tab=tabs[0];setPage(tab?.url??"");
      const result=await browser.storage.session.get("vortex_media_by_tab");
      const media=(result.vortex_media_by_tab as {tabId:number}[]|undefined)??[];
      setMediaCount(media.filter(item=>item.tabId===tab?.id).length);
    });
    const connection=new ConnectionManager();
    void connection.request("handshake",{ext_version:"0.2.0",browser:browserName(),capabilities:["downloads","media-sniffer","batch","adblock"]})
      .then(()=>{if(alive)setConnected(true);}).catch(()=>{if(alive)setConnected(false);});
    return ()=>{alive=false;connection.disconnect();};
  },[]);
  const extract=async()=>{
    if(!page||!isHttpUrl(page))return;
    let cookies:unknown[]=[];
    const consent=window.confirm("Send this site's session cookies to VortexDM for this extraction? Cookies are not stored by the extension.");
    if(consent){
      const origin=new URL(page).origin;
      const allowed=await browser.permissions.request({origins:[`${origin}/*`]});
      if(allowed)cookies=await browser.cookies.getAll({url:page});
    }
    await browser.runtime.sendMessage({type:"VORTEX_EXTRACT_PAGE",url:page,cookies});
  };
  const grab=async()=>browser.tabs.query({active:true,currentWindow:true}).then(tabs=>{
    const id=tabs[0]?.id;if(id!==undefined)return browser.tabs.sendMessage(id,{type:"VORTEX_SCAN_PAGE"});
  });
  let hostname="No active page";try{if(page)hostname=new URL(page).hostname;}catch{}
  return <main>
    <header><div class="brand">Vortex<span>DM</span></div><div class={connected?"status on":"status"}>{connected?"Connected":"Local filters active"}</div></header>
    <section class="card"><div class="muted">CURRENT PAGE</div><div class="page">{hostname}</div><div class="row"><span>Detected media</span><strong>{mediaCount}</strong></div><button onClick={extract} disabled={!isHttpUrl(page)}>Extract with yt-dlp</button></section>
    <section class="privacy"><strong>Privacy protection enabled</strong><span>Ad and tracker rules run locally in this browser.</span></section>
    <section class="actions"><button class="secondary" onClick={grab}>Grab page links</button><button class="secondary" onClick={()=>browser.runtime.openOptionsPage()}>Settings</button></section>
    <footer>Local-first · No analytics · Vortex Browser Bridge 0.2.0</footer>
  </main>;
}
function isHttpUrl(value:string):boolean{try{return ["http:","https:"].includes(new URL(value).protocol);}catch{return false;}}
render(<Popup/>,document.getElementById("app")!);
