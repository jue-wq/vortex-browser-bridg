import { render } from "preact";
import { useEffect, useState } from "preact/hooks";
import { browser } from "wxt/browser";
import "./style.css";

function Options(){
  const [captureEnabled,setCaptureEnabled]=useState(true);
  const [adblockEnabled,setAdblockEnabled]=useState(true);
  const [cookiePolicy,setCookiePolicy]=useState("ask");
  const [customRules,setCustomRules]=useState("");
  const [mobilePort,setMobilePort]=useState("17321");
  const [mobileKey,setMobileKey]=useState("");
  useEffect(()=>{
    void browser.storage.local.get(["captureEnabled","vortexAdblockEnabled","cookiePolicy","vortexCustomFilterRules","mobileBridgePort","mobileBridgeApiKey"]).then(saved=>{
      setCaptureEnabled(saved.captureEnabled!==false);
      setAdblockEnabled(saved.vortexAdblockEnabled!==false);
      setCookiePolicy(typeof saved.cookiePolicy==="string"?saved.cookiePolicy:"ask");
      setCustomRules(typeof saved.vortexCustomFilterRules==="string"?saved.vortexCustomFilterRules:"");
      setMobilePort(String(saved.mobileBridgePort??17321));
      setMobileKey(typeof saved.mobileBridgeApiKey==="string"?saved.mobileBridgeApiKey:"");
    });
  },[]);
  const save=async()=>{
    const port=Number(mobilePort);
    if(!Number.isInteger(port)||port<1||port>65535)return;
    await browser.storage.local.set({
      captureEnabled,vortexAdblockEnabled:adblockEnabled,cookiePolicy,
      vortexCustomFilterRules:customRules,mobileBridgePort:port,mobileBridgeApiKey:mobileKey
    });
    window.alert("Settings saved.");
  };
  return <main>
    <aside><h2>VortexDM</h2><p>Connection</p><p>Interception Rules</p><p>Privacy & Filters</p><p>Media & yt-dlp</p><p>Interface</p></aside>
    <section><h1>Settings</h1>
      <article><h3>Download interception</h3><label><input type="checkbox" checked={captureEnabled} onChange={event=>setCaptureEnabled(event.currentTarget.checked)}/> Capture browser downloads</label><p>Browser downloads continue unless VortexDM acknowledges within 1.5 seconds.</p></article>
      <article><h3>uBlock-Origin-style privacy filtering</h3>
        <label><input type="checkbox" checked={adblockEnabled} onChange={event=>setAdblockEnabled(event.currentTarget.checked)}/> Block common ads and trackers</label>
        <p>Local network rules, allow exceptions and cosmetic filters are applied without analytics. Supported rule forms include <code>||domain^</code>, <code>@@||domain^</code>, <code>##.selector</code> and <code>example.org##.selector</code>.</p>
        <label class="stack">Custom filter rules<textarea rows={8} value={customRules} onInput={event=>setCustomRules(event.currentTarget.value)} placeholder={"||ads.example^
@@||trusted.example^
##.sponsored"} /></label>
        <p>Paste ABP/uBO-style rules here. Unsupported advanced syntax is ignored; this is not full uBlock Origin feature parity.</p>
      </article>
      <article><h3>Media & privacy</h3><label>Cookie transfer policy <select value={cookiePolicy} onChange={event=>setCookiePolicy(event.currentTarget.value)}><option value="ask">Ask every time</option><option value="media">Media sites only</option><option value="never">Never</option></select></label><p>Cookies are read only after a user action and are not written to extension storage.</p></article>
      <article><h3>Android local bridge</h3><p>Firefox for Android has no Native Messaging API. Configure this only after enabling the VortexDM app's loopback server. It must listen on 127.0.0.1 only.</p><label class="stack">Local port<input value={mobilePort} onInput={event=>setMobilePort(event.currentTarget.value)} /></label><label class="stack">One-time API key<input type="password" value={mobileKey} onInput={event=>setMobileKey(event.currentTarget.value)} placeholder="At least 32 random characters" /></label></article>
      <button onClick={()=>void save()}>Save settings</button>
    </section>
  </main>;
}
render(<Options/>,document.getElementById("app")!);
