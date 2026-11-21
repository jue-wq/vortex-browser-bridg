import { render } from "preact";
import { useState } from "preact/hooks";
import { browser } from "wxt/browser";
import "./style.css";
function Options() {
  const [enabled,setEnabled] = useState(true);
  const [cookiePolicy,setCookiePolicy] = useState("ask");
  return <main><aside><h2>VortexDM</h2><p>Connection</p><p>Interception Rules</p><p>Media & yt-dlp</p><p>Interface</p></aside><section><h1>Settings</h1><article><h3>Interception</h3><label><input type="checkbox" checked={enabled} onChange={event=>setEnabled(event.currentTarget.checked)}/> Capture browser downloads</label><p>Safe fallback: browser downloads continue unless VortexDM acknowledges within 1.5 seconds.</p></article><article><h3>Media & privacy</h3><label>Cookie transfer policy <select value={cookiePolicy} onChange={event=>setCookiePolicy(event.currentTarget.value)}><option value="ask">Ask every time</option><option value="media">Media sites only</option><option value="never">Never</option></select></label><p>Cookies are read only after a user action and are not written to extension storage.</p></article><button onClick={()=>void browser.storage.local.set({captureEnabled:enabled,cookiePolicy})}>Save settings</button></section></main>;
}
render(<Options/>,document.getElementById("app")!);
