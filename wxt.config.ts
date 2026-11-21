import { defineConfig } from "wxt";

export default defineConfig({
  modules: [],
  manifest: {
    name: "Vortex Browser Bridge",
    description: "Securely connects browser downloads and detected media to VortexDM.",
    version: "0.1.0",
    permissions: ["downloads", "nativeMessaging", "storage", "contextMenus", "tabs", "webRequest", "cookies"],
    optional_host_permissions: ["<all_urls>"],
    action: { default_title: "VortexDM" },
    browser_specific_settings: {
      gecko: { id: "vortex-browser-bridge@vortexdm.local", strict_min_version: "121.0" }
    },
    content_security_policy: { extension_pages: "script-src 'self'; object-src 'self'; connect-src 'self' http://127.0.0.1:*" }
  }
});
