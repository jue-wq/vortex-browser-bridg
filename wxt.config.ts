import { defineConfig } from "wxt";

export default defineConfig({
  modules: [],
  targetBrowsers: ["chrome", "firefox"],
  manifest: ({ browser, manifestVersion }) => {
    const firefoxAndroid = browser === "firefox" && manifestVersion === 2;
    const permissions = firefoxAndroid
      ? ["storage", "tabs", "contextMenus", "webRequest", "webRequestBlocking", "cookies", "<all_urls>"]
      : browser === "firefox"
        ? ["downloads", "nativeMessaging", "storage", "contextMenus", "tabs", "webRequest", "webRequestBlocking", "cookies"]
        : ["downloads", "nativeMessaging", "storage", "contextMenus", "tabs", "webRequest", "cookies", "declarativeNetRequest"];
    return {
      name: "Vortex Browser Bridge",
      description: "Local-first download capture and privacy filtering for VortexDM.",
      version: "0.2.0",
      permissions,
      ...(manifestVersion === 3 ? { host_permissions: ["<all_urls>"] } : {}),
      action: { default_title: "VortexDM" },
      browser_specific_settings: {
        gecko: { id: "vortex-browser-bridge@vortexdm.local", strict_min_version: "121.0" }
      }
    };
  }
});
