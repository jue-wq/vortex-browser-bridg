import { browser } from "wxt/browser";
import { DEFAULT_FILTER_RULES, FilterEngine } from "../src/adblock/FilterEngine";

export default defineContentScript({
  matches:["http://*/*","https://*/*"],runAt:"document_start",
  main() {
    void applyCosmeticFilters();
    const host=document.createElement("div");
    host.id="vortexdm-shadow-host";
    const shadow=host.attachShadow({mode:"closed"});
    const style=document.createElement("style");
    style.textContent=":host{all:initial}.pill{position:fixed;z-index:2147483647;right:20px;bottom:20px;background:#181D28;color:#E6EDF5;border:1px solid #4F8CFF;border-radius:18px;padding:9px 14px;font:13px sans-serif;box-shadow:0 4px 20px #0008;cursor:pointer}";
    const button=document.createElement("button");
    button.className="pill";button.textContent="Grab page links";
    button.addEventListener("click",()=>void scanAndSend());
    shadow.append(style,button);
    const attach=()=>{if(document.documentElement&&!host.isConnected)document.documentElement.append(host);};
    attach();
    if(!document.documentElement)new MutationObserver(attach).observe(document,{childList:true});
    browser.runtime.onMessage.addListener((message:unknown)=>{
      if(message&&typeof message==="object"&&"type" in message&&message.type==="VORTEX_SCAN_PAGE")void scanAndSend();
    });

    async function applyCosmeticFilters():Promise<void>{
      const saved=await browser.storage.local.get("vortexCustomFilterRules");
      const custom=typeof saved.vortexCustomFilterRules==="string"?saved.vortexCustomFilterRules.split(/\r?\n/):[];
      const engine=new FilterEngine([...DEFAULT_FILTER_RULES,...custom]);
      const selectors=engine.getCosmeticSelectors(location.hostname);
      if(!selectors.length)return;
      const css=selectors.map(selector=>selector+"{display:none!important;visibility:hidden!important}").join("\n");
      const element=document.createElement("style");
      element.dataset.vortexAdblock="true";element.textContent=css;
      const target=document.head??document.documentElement;
      if(target)target.append(element);
      else new MutationObserver(()=>{
        const readyTarget=document.head??document.documentElement;
        if(readyTarget)readyTarget.append(element);
      }).observe(document,{childList:true,subtree:true});
    }

    async function scanAndSend():Promise<void>{
      const urls=[...document.querySelectorAll<HTMLAnchorElement>("a[href]")].map(anchor=>anchor.href).filter(url=>/^https?:/i.test(url));
      await browser.runtime.sendMessage({type:"VORTEX_ADD_BATCH",urls:[...new Set(urls)].slice(0,5000),sourcePage:location.href});
    }
  }
});
