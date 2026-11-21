import { defineConfig } from "wxt";

export default defineConfig({
  modules: [],
  targetBrowsers: ["chrome", "firefox"],
  manifest: ({ browser, manifestVersion }) => {
    const firefoxAndroid = browser === "firefox" && manifestVersion === 2;
    const permissions = firefoxAndroid
      ? ["storage", "tabs", "contextMenus", "webRequest", "webRequestBlocking", "webNavigation", "<all_urls>"]
      : browser === "firefox"
        ? ["downloads", "nativeMessaging", "storage", "contextMenus", "tabs", "webRequest", "webRequestBlocking", "webNavigation"]
        : ["downloads", "nativeMessaging", "storage", "contextMenus", "tabs", "webRequest", "declarativeNetRequest"];
    return {
      name: "Vortex Browser Bridge",
      default_locale: "en",
      description: "Local-first download capture and privacy filtering for VortexDM.",
      version: "0.2.0",
      permissions,
      ...(manifestVersion === 3 ? { host_permissions: ["<all_urls>"] } : {}),
      icons: { 32: "/icon-32.png" },
      action: { default_title: "VortexDM", default_icon: { 32: "/icon-32.png" } },
      commands: {
        "vortex-grab-links": { suggested_key: { default: "Ctrl+Shift+Y" }, description: "Grab all links from the current page" },
        "vortex-extract-page": { suggested_key: { default: "Ctrl+Shift+E" }, description: "Extract the current page with yt-dlp" }
      },
      browser_specific_settings: {
        gecko: { id: "vortex-browser-bridge@vortexdm.local", strict_min_version: "121.0" }
      }
    };
  }
});
