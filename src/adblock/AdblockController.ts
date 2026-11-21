import { browser } from "wxt/browser";
import { WebExtensionBlocker } from "@ghostery/adblocker-webextension";
import { DEFAULT_FILTER_RULES, FilterEngine, type DnrRule } from "./FilterEngine";
import { loadGhosteryEngine, saveGhosteryEngine } from "./GhosteryFilterStore";

interface DnrApi {
  getDynamicRules(): Promise<{id:number}[]>;
  updateDynamicRules(options:{removeRuleIds:number[];addRules:DnrRule[]}):Promise<void>;
}
interface BlockingApi {
  onBeforeRequest: {
    addListener(listener:(details:{url:string;initiator?:string;type?:string})=>{cancel:boolean}, filter:{urls:string[]}, extraInfoSpec:string[]):void;
    removeListener(listener:(details:{url:string;initiator?:string;type?:string})=>{cancel:boolean}):void;
  };
}
const STORAGE_KEYS = ["vortexAdblockEnabled","vortexCustomFilterRules"] as const;

export class AdblockController {
  private engine = new FilterEngine();
  private enabled = true;
  private started = false;
  private usingDnr = false;
  private blocker: WebExtensionBlocker | null = null;
  private fullListsActive = false;
  private fallbackListener: ((details:{url:string;initiator?:string;type?:string})=>{cancel:boolean}) | null = null;

  async start(): Promise<void> {
    if (this.started) return;
    this.started = true;
    await this.refresh(false);
    const values = await browser.storage.local.get("vortexFullFilterListsEnabled");
    if (values.vortexFullFilterListsEnabled === true && this.isFirefox()) {
      try {
        const cached = await loadGhosteryEngine();
        if (cached) {
          this.blocker = WebExtensionBlocker.deserialize(cached);
          this.attachGhosteryBlocker();
        }
      } catch {
        // An invalid/stale cache falls back to the small bundled rule set.
      }
    }
    this.attachFallback();
    await this.refreshDnr();
  }

  async refresh(rebuild = true): Promise<void> {
    const values = await browser.storage.local.get([...STORAGE_KEYS]);
    this.enabled = values.vortexAdblockEnabled !== false;
    const custom = typeof values.vortexCustomFilterRules === "string"
      ? values.vortexCustomFilterRules.split(/\r?\n/)
      : [];
    this.engine = new FilterEngine([...DEFAULT_FILTER_RULES,...custom]);
    if (this.blocker) {
      if (this.enabled) this.attachGhosteryBlocker();
      else this.detachGhosteryBlocker();
    }
    if (rebuild) await this.refreshDnr();
  }

  async enableFullLists(): Promise<void> {
    if (!this.isFirefox()) {
      throw new Error("Full filter-list mode requires Firefox desktop or Firefox for Android. Chromium MV3 uses DNR-compatible rules.");
    }
    const blocker = await WebExtensionBlocker.fromPrebuiltAdsAndTracking(fetch);
    await saveGhosteryEngine(blocker.serialize());
    if (this.blocker && this.fullListsActive) this.detachGhosteryBlocker();
    this.blocker = blocker;
    this.fullListsActive = false;
    await browser.storage.local.set({vortexFullFilterListsEnabled:true});
    if (this.enabled) this.attachGhosteryBlocker();
  }

  async disableFullLists(): Promise<void> {
    this.detachGhosteryBlocker();
    this.blocker = null;
    this.fullListsActive = false;
    await browser.storage.local.set({vortexFullFilterListsEnabled:false});
  }

  private attachFallback(): void {
    const firefox = this.isFirefox();
    const dnr = (browser as unknown as {declarativeNetRequest?:DnrApi}).declarativeNetRequest;
    if (!firefox && dnr) { this.usingDnr = true; return; }
    const webRequest = (browser as unknown as {webRequest?:BlockingApi}).webRequest;
    if (!webRequest || this.fallbackListener) return;
    this.fallbackListener = details => ({
      cancel:this.enabled && this.engine.shouldBlock({url:details.url,initiator:details.initiator,type:details.type})
    });
    webRequest.onBeforeRequest.addListener(this.fallbackListener,{urls:["http://*/*","https://*/*"]},["blocking"]);
  }

  private async refreshDnr(): Promise<void> {
    if (!this.usingDnr) return;
    const dnr = (browser as unknown as {declarativeNetRequest?:DnrApi}).declarativeNetRequest;
    if (!dnr) return;
    const current = await dnr.getDynamicRules();
    const addRules = this.enabled ? this.engine.toDnrRules() : [];
    await dnr.updateDynamicRules({removeRuleIds:current.map(rule=>rule.id),addRules});
  }

  private attachGhosteryBlocker(): void {
    if (!this.blocker || this.fullListsActive || !this.enabled) return;
    this.blocker.enableBlockingInBrowser(browser as Parameters<WebExtensionBlocker["enableBlockingInBrowser"]>[0]);
    this.fullListsActive = true;
  }

  private detachGhosteryBlocker(): void {
    if (!this.blocker || !this.fullListsActive) return;
    try {
      this.blocker.disableBlockingInBrowser(browser as Parameters<WebExtensionBlocker["disableBlockingInBrowser"]>[0]);
    } catch {
      // The browser context may already have been torn down by the extension host.
    }
    this.fullListsActive = false;
  }

  private isFirefox(): boolean { return /firefox/i.test(navigator.userAgent); }
}
