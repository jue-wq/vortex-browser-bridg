import { browser } from "wxt/browser";
import { ConnectionManager } from "../src/transport/ConnectionManager";
import { addDownloadPayloadSchema } from "../src/protocol/schema";
import { decideCapture, defaultInterceptionSettings } from "../src/background/RuleEngine";
import { classifyMedia, deduplicateMedia, type DetectedMedia } from "../src/background/MediaSniffer";
import { detectYtDlpPage } from "../src/background/YtDlpDetector";

const connection = new ConnectionManager();
const settings = {...defaultInterceptionSettings};

export default defineBackground(() => {
  browser.runtime.onInstalled.addListener(() => {
    void browser.contextMenus.removeAll().then(() => {
      browser.contextMenus.create({id: "vortex-download-link", title: "Download with VortexDM", contexts: ["link"]});
      browser.contextMenus.create({id: "vortex-extract-page", title: "Extract page with yt-dlp", contexts: ["page"]});
      browser.contextMenus.create({id: "vortex-grab-links", title: "Grab all page links", contexts: ["page"]});
    });
  });

  browser.downloads.onCreated.addListener((item) => { void interceptDownload(item); });

  browser.webRequest.onCompleted.addListener((details) => {
    const kind = classifyMedia(details.url, details.type === "media" ? "video/*" : "");
    if (!kind || details.tabId < 0) return;
    void saveDetectedMedia({url: details.url, kind, tabId: details.tabId, seenAt: Date.now()});
  }, {urls: ["http://*/*", "https://*/*"]});

  browser.contextMenus.onClicked.addListener((info, tab) => {
    if (!tab?.id) return;
    if (info.menuItemId === "vortex-extract-page" && tab.url) {
      void connection.request("extract_media", {
        webpage_url: tab.url, page_title: tab.title ?? "", user_agent: navigator.userAgent,
        cookies: [], playlist_mode: detectYtDlpPage(tab.url).playlist ? "ask" : "single"
      }).catch(() => undefined);
    }
    if (info.menuItemId === "vortex-grab-links") void browser.tabs.sendMessage(tab.id, {type: "VORTEX_SCAN_PAGE"});
    if (info.menuItemId === "vortex-download-link" && info.linkUrl) {
      void sendDownload(info.linkUrl, tab.url ?? undefined, undefined);
    }
  });

  browser.runtime.onMessage.addListener((message: unknown, sender) => {
    if (!message || typeof message !== "object" || !("type" in message)) return;
    const value = message as {type: string; urls?: string[]; sourcePage?: string; url?: string};
    if (value.type === "VORTEX_ADD_BATCH" && Array.isArray(value.urls)) {
      const items = value.urls.filter(url => isHttpUrl(url)).map(url => ({url}));
      if (items.length) void connection.request("add_batch", {items, source_page: value.sourcePage ?? sender.tab?.url ?? "https://invalid.local"});
    }
    if (value.type === "VORTEX_ADD_DOWNLOAD" && value.url) void sendDownload(value.url, sender.tab?.url, undefined);
  });

  async function interceptDownload(item: browser.DownloadItem): Promise<void> {
    const decision = decideCapture({url: item.url, filename: item.filename, totalBytes: item.totalBytes, incognito: item.incognito}, settings);
    if (!decision.capture || !item.url) return;
    // Safe handoff: never cancel/erase unless the native host acknowledges the task.
    try {
      const parsed = addDownloadPayloadSchema.parse({
        url: item.url, headers: {}, cookies: [], auto_start: true,
        filename: item.filename || undefined, download_page: item.referrer || undefined
      });
      const response = await connection.request("add_download", parsed, 1500);
      if (response.payload.accepted === true) {
        await browser.downloads.cancel(item.id);
        await browser.downloads.erase({id: item.id});
      }
    } catch {
      // Intentionally leave the original browser download untouched on every error/timeout.
    }
  }

  async function sendDownload(url: string, page?: string, filename?: string): Promise<void> {
    if (!isHttpUrl(url)) return;
    await connection.request("add_download", {
      url, headers: {}, cookies: [], auto_start: true,
      ...(page ? {download_page: page} : {}), ...(filename ? {filename} : {})
    }).catch(() => undefined);
  }

  async function saveDetectedMedia(item: DetectedMedia): Promise<void> {
    const key = "vortex_media_by_tab";
    const state = await browser.storage.session.get(key);
    const current = (state[key] as DetectedMedia[] | undefined) ?? [];
    const next = deduplicateMedia([...current.filter(media => media.tabId !== item.tabId || Date.now() - media.seenAt < 30 * 60_000), item]);
    await browser.storage.session.set({[key]: next});
  }
});

function isHttpUrl(value: string): boolean {
  try { return ["http:", "https:"].includes(new URL(value).protocol); } catch { return false; }
}
