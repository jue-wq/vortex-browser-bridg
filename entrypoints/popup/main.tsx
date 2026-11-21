import { render } from "preact";
import { useEffect, useState } from "preact/hooks";
import { browser } from "wxt/browser";
import "./style.css";

function Popup() {
  const [connected, setConnected] = useState(false);
  const [mediaCount, setMediaCount] = useState(0);
  const [page, setPage] = useState("");
  useEffect(() => {
    void browser.tabs.query({active: true, currentWindow: true}).then(async tabs => {
      const tab = tabs[0];
      setPage(tab?.url ?? "");
      const result = await browser.storage.session.get("vortex_media_by_tab");
      const media = (result.vortex_media_by_tab as {tabId:number}[] | undefined) ?? [];
      setMediaCount(media.filter(item => item.tabId === tab?.id).length);
    });
    const port = browser.runtime.connectNative("com.vortexdm.native_host");
    port.onMessage.addListener((message: unknown) => {
      if (message && typeof message === "object" && "type" in message) setConnected(true);
    });
    port.onDisconnect.addListener(() => setConnected(false));
    port.postMessage({protocol_version:1,type:"handshake",request_id:crypto.randomUUID(),timestamp:Math.floor(Date.now()/1000),payload:{ext_version:"0.1.0",browser:"chrome",capabilities:["downloads","media-sniffer","batch"]}});
    return () => port.disconnect();
  }, []);
  const extract = async () => {
    if (!page) return;
    const tabs = await browser.tabs.query({active:true,currentWindow:true});
    const tab = tabs[0];
    const cookies = await browser.cookies.getAll({url:page});
    const consented = window.confirm("Send this site's session cookies to VortexDM for this extraction? Cookies are not stored by the extension.");
    await browser.runtime.sendMessage({type:"VORTEX_EXTRACT_PAGE",url:page,cookies:consented ? cookies : []});
    void tab;
  };
  const grab = async () => browser.tabs.query({active:true,currentWindow:true}).then(tabs => {
    const id = tabs[0]?.id;
    if (id !== undefined) return browser.tabs.sendMessage(id,{type:"VORTEX_SCAN_PAGE"});
  });
  return <main>
    <header><div class="brand">Vortex<span>DM</span></div><div class={connected ? "status on" : "status"}>{connected ? "Connected" : "Disconnected"}</div></header>
    <section class="card"><div class="muted">CURRENT PAGE</div><div class="page">{page ? new URL(page).hostname : "No active page"}</div><div class="row"><span>Detected media</span><strong>{mediaCount}</strong></div><button onClick={extract} disabled={!page}>Extract with yt-dlp</button></section>
    <section class="actions"><button class="secondary" onClick={grab}>Grab page links</button><button class="secondary" onClick={() => browser.runtime.openOptionsPage()}>Settings</button></section>
    <footer>Local-first · No analytics · Vortex Browser Bridge 0.1.0</footer>
  </main>;
}
render(<Popup />, document.getElementById("app")!);
