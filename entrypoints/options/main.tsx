import { render } from "preact";
import { useEffect, useState } from "preact/hooks";
import { browser } from "wxt/browser";
import "./style.css";

const t=(key:string,fallback:string)=>browser.i18n.getMessage(key)||fallback;

function Options(){
  const [captureEnabled,setCaptureEnabled]=useState(true);
  const [minSizeMb,setMinSizeMb]=useState("0");
  const [excludedDomains,setExcludedDomains]=useState("");
  const [allowedDomains,setAllowedDomains]=useState("");
  const [includedExtensions,setIncludedExtensions]=useState("");
  const [includedMimeTypes,setIncludedMimeTypes]=useState("");
  const [incognitoAllowed,setIncognitoAllowed]=useState(false);
  const [adblockEnabled,setAdblockEnabled]=useState(true);
  const [customRules,setCustomRules]=useState("");
  const [mobilePort,setMobilePort]=useState("17321");
  const [mobileKey,setMobileKey]=useState("");
  const [fullListsEnabled,setFullListsEnabled]=useState(false);
  const [updatingLists,setUpdatingLists]=useState(false);
  useEffect(()=>{
    void browser.storage.local.get(["captureEnabled","captureMinSizeBytes","captureExcludedDomains","captureAllowedDomains","captureIncludedExtensions","captureIncludedMimeTypes","captureIncognitoAllowed","vortexAdblockEnabled","vortexCustomFilterRules","mobileBridgePort","mobileBridgeApiKey","vortexFullFilterListsEnabled"]).then(saved=>{
      setCaptureEnabled(saved.captureEnabled!==false);
      setMinSizeMb(String(Number(saved.captureMinSizeBytes??0)/1048576));
      setExcludedDomains(Array.isArray(saved.captureExcludedDomains)?saved.captureExcludedDomains.join(", "):"");
      setAllowedDomains(Array.isArray(saved.captureAllowedDomains)?saved.captureAllowedDomains.join(", "):"");
      setIncludedExtensions(Array.isArray(saved.captureIncludedExtensions)?saved.captureIncludedExtensions.join(", "):"");
      setIncludedMimeTypes(Array.isArray(saved.captureIncludedMimeTypes)?saved.captureIncludedMimeTypes.join(", "):"");
      setIncognitoAllowed(saved.captureIncognitoAllowed===true);
      setAdblockEnabled(saved.vortexAdblockEnabled!==false);
      setCustomRules(typeof saved.vortexCustomFilterRules==="string"?saved.vortexCustomFilterRules:"");
      setMobilePort(String(saved.mobileBridgePort??17321));
      setMobileKey(typeof saved.mobileBridgeApiKey==="string"?saved.mobileBridgeApiKey:"");
      setFullListsEnabled(saved.vortexFullFilterListsEnabled===true);
    });
  },[]);
  const save=async()=>{
    const port=Number(mobilePort);
    if(!Number.isInteger(port)||port<1||port>65535)return;
    const minMb=Number(minSizeMb);
    if(!Number.isFinite(minMb)||minMb<0||minMb>1048576)return;
    const splitValues=(value:string)=>value.split(/[\s,;]+/).map(item=>item.trim()).filter(Boolean);
    await browser.storage.local.set({
      captureEnabled,captureMinSizeBytes:Math.floor(minMb*1048576),
      captureExcludedDomains:splitValues(excludedDomains),captureAllowedDomains:splitValues(allowedDomains),
      captureIncludedExtensions:splitValues(includedExtensions),captureIncludedMimeTypes:splitValues(includedMimeTypes),
      captureIncognitoAllowed,...(!firefoxAndroid?{vortexAdblockEnabled:adblockEnabled}:{}),
      vortexCustomFilterRules:customRules,mobileBridgePort:port,mobileBridgeApiKey:mobileKey
    });
    window.alert(t("settingsSaved","Settings saved."));
  };
  const updateFullLists=async()=>{
    const consent=window.confirm("Firefox will download public EasyList/EasyPrivacy-compatible filter subscriptions from Ghostery and cache the compiled rules locally. No browsing history or page URLs are uploaded. Continue?");
    if(!consent)return;
    setUpdatingLists(true);
    try{
      const result=await browser.runtime.sendMessage({type:"VORTEX_ENABLE_FULL_FILTERS"}) as {success?:boolean;message?:string};
      if(!result?.success)throw new Error(result?.message??"Could not enable full filter lists");
      setFullListsEnabled(true);
      window.alert("Full filter lists are enabled and cached locally.");
    }catch(error){
      window.alert(error instanceof Error?error.message:"Could not update filter lists");
    }finally{setUpdatingLists(false);}
  };
  const disableFullLists=async()=>{
    const result=await browser.runtime.sendMessage({type:"VORTEX_DISABLE_FULL_FILTERS"}) as {success?:boolean;message?:string};
    if(result?.success)setFullListsEnabled(false);
    else window.alert(result?.message??"Could not disable full filter lists");
  };
  const firefox=/firefox/i.test(navigator.userAgent);
  const firefoxAndroid=firefox && /android/i.test(navigator.userAgent);
  return <main>
    <aside><h2>VortexDM</h2><p>{t("connection","Connection")}</p><p>{t("interceptionRules","Interception Rules")}</p><p>{t("privacyFilters","Privacy & Filters")}</p><p>{t("mediaYtdlp","Media & yt-dlp")}</p><p>{t("interface","Interface")}</p></aside>
    <section><h1>{t("optionsTitle","Settings")}</h1>
      <article><h3>{t("downloadInterception","Download interception")}</h3>
        <label><input type="checkbox" checked={captureEnabled} onChange={event=>setCaptureEnabled(event.currentTarget.checked)}/> {t("captureDownloads","Capture browser downloads")}</label>
        <label class="stack">Minimum file size (MiB)<input type="number" min="0" step="1" value={minSizeMb} onInput={event=>setMinSizeMb(event.currentTarget.value)} /></label>
        <label class="stack">{t("excludedDomains","Excluded domains")}<input value={excludedDomains} onInput={event=>setExcludedDomains(event.currentTarget.value)} placeholder="example.com, private.example" /></label>
        <label class="stack">{t("allowedDomainsLabel","Allowed domains (leave empty for all)")}<input value={allowedDomains} onInput={event=>setAllowedDomains(event.currentTarget.value)} placeholder="downloads.example.com" /></label>
        <label class="stack">{t("fileExtensionsLabel","File extensions")}<input value={includedExtensions} onInput={event=>setIncludedExtensions(event.currentTarget.value)} placeholder="zip, mp4, pdf" /></label>
        <label class="stack">{t("mimeTypesLabel","MIME types")}<input value={includedMimeTypes} onInput={event=>setIncludedMimeTypes(event.currentTarget.value)} placeholder="video/, application/zip" /></label>
        <label><input type="checkbox" checked={incognitoAllowed} onChange={event=>setIncognitoAllowed(event.currentTarget.checked)}/> {t("privateWindows","Allow capture in private windows")}</label>
        <p>{t("ackTimeout","Browser downloads continue unless VortexDM acknowledges within 1.5 seconds.")}</p></article>
      {firefoxAndroid ? <article><h3>{t("androidUboTitle","Ad blocking: original uBlock Origin")}</h3><p>{t("uboDescription","Android filtering is handled by the original uBlock Origin by Raymond Hill. Bridge filtering is disabled on Android.")}</p><p><a href="https://addons.mozilla.org/android/addon/ublock-origin/" target="_blank" rel="noreferrer">{t("installUbo","Install uBlock Origin from Mozilla Add-ons")}</a></p></article> : <article><h3>{t("privacyFiltering","Privacy filtering")}</h3>
        <label><input type="checkbox" checked={adblockEnabled} onChange={event=>setAdblockEnabled(event.currentTarget.checked)}/> Block common ads and trackers</label>
        <p>{t("privacyFilteringText","Local rules run in the browser. Chromium MV3 uses DNR-compatible rules; Firefox desktop supports full filter-list processing.")}</p>
        {firefox ? <div class="filter-status"><strong>{fullListsEnabled?t("fullListsEnabled","Full filter lists enabled"):t("builtInRules","Using built-in local rules")}</strong><button class="secondary" disabled={updatingLists} onClick={()=>void updateFullLists()}>{updatingLists?t("updating","Updating…"):fullListsEnabled?t("updateLists","Update EasyList/EasyPrivacy lists"):t("enableLists","Enable full filter lists")}</button>{fullListsEnabled?<button class="secondary" onClick={()=>void disableFullLists()}>{t("builtInOnly","Use built-in rules only")}</button>:null}<p>First enable/update downloads public filter subscriptions; compiled rules are cached on this device. This feature uses the MPL-2.0 Ghostery WebExtension blocker.</p></div>:<p>Full advanced filter lists are not available in Chromium MV3; use the supported local DNR rules and custom filters.</p>}
        <label class="stack">Custom filter rules<textarea rows={8} value={customRules} onInput={event=>setCustomRules(event.currentTarget.value)} placeholder={"||ads.example^\n@@||trusted.example^\n##.sponsored"} /></label>
        <p>{t("customRulesHelp","Custom rules use ABP/uBO-like syntax. Unsupported advanced syntax is ignored by the built-in Chromium-compatible subset.")}</p>
      </article>}

      <article><h3>{t("androidBridge","Android local bridge")}</h3><p>{t("androidBridgeHelp","Firefox for Android has no Native Messaging API. Enable the VortexDM app loopback server first. It must listen on 127.0.0.1 only.")}</p><label class="stack">{t("localPort","Local port")}<input value={mobilePort} onInput={event=>setMobilePort(event.currentTarget.value)} /></label><label class="stack">{t("oneTimeKey","One-time API key")}<input type="password" value={mobileKey} onInput={event=>setMobileKey(event.currentTarget.value)} placeholder={t("apiKeyHelp","At least 32 random characters")} /></label></article>
      <button onClick={()=>void save()}>{t("saveSettings","Save settings")}</button>
    </section>
  </main>;
}
render(<Options/>,document.getElementById("app")!);
