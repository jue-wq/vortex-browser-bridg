export default defineContentScript({
  matches: ["http://*/*", "https://*/*"],
  runAt: "document_idle",
  main() {
    const host = document.createElement("div");
    host.id = "vortexdm-shadow-host";
    const shadow = host.attachShadow({mode: "closed"});
    const style = document.createElement("style");
    style.textContent = `:host{all:initial}.pill{position:fixed;z-index:2147483647;right:20px;bottom:20px;background:#181D28;color:#E6EDF5;border:1px solid #4F8CFF;border-radius:18px;padding:9px 14px;font:13px sans-serif;box-shadow:0 4px 20px #0008;cursor:pointer}`;
    const button = document.createElement("button");
    button.className = "pill";
    button.textContent = "Grab page links";
    button.addEventListener("click", () => void scanAndSend());
    shadow.append(style, button);
    document.documentElement.append(host);
    browser.runtime.onMessage.addListener((message: unknown) => {
      if (message && typeof message === "object" && "type" in message && message.type === "VORTEX_SCAN_PAGE") void scanAndSend();
    });
    async function scanAndSend(): Promise<void> {
      const urls = [...document.querySelectorAll<HTMLAnchorElement>("a[href]")]
        .map(anchor => anchor.href)
        .filter(url => /^https?:/i.test(url));
      const unique = [...new Set(urls)].slice(0, 5000);
      await browser.runtime.sendMessage({type: "VORTEX_ADD_BATCH", urls: unique, sourcePage: location.href});
    }
  }
});
