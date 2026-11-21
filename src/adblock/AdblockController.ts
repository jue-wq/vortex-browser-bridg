import { browser } from "wxt/browser";
import { DEFAULT_FILTER_RULES, FilterEngine, type DnrRule } from "./FilterEngine";

interface DnrApi {
  getDynamicRules(): Promise<{id:number}[]>;
  updateDynamicRules(options:{removeRuleIds:number[];addRules:DnrRule[]}):Promise<void>;
}
interface BlockingApi {
  onBeforeRequest: {
    addListener(
      listener:(details:{url:string;initiator?:string;type?:string})=>{cancel:boolean},
      filter:{urls:string[]},
      extraInfoSpec:string[]
    ):void;
  };
}
const STORAGE_KEYS = ["vortexAdblockEnabled","vortexCustomFilterRules"] as const;

export class AdblockController {
  private engine = new FilterEngine();
  private enabled = true;
  private attached = false;
  private usingDnr = false;

  async start(): Promise<void> {
    await this.refresh();
    if (this.attached) return;
    this.attached = true;
    const dnr = (browser as unknown as {declarativeNetRequest?:DnrApi}).declarativeNetRequest;
    if (dnr) {
      this.usingDnr = true;
      return;
    }
    const webRequest = (browser as unknown as {webRequest?:BlockingApi}).webRequest;
    webRequest?.onBeforeRequest.addListener(details => ({
      cancel:this.enabled && this.engine.shouldBlock({url:details.url,initiator:details.initiator,type:details.type})
    }),{urls:["<all_urls>"]},["blocking"]);
  }

  async refresh(): Promise<void> {
    const values = await browser.storage.local.get([...STORAGE_KEYS]);
    this.enabled = values.vortexAdblockEnabled !== false;
    const custom = typeof values.vortexCustomFilterRules === "string" ? values.vortexCustomFilterRules.split(/\r?\n/) : [];
    this.engine = new FilterEngine([...DEFAULT_FILTER_RULES,...custom]);
    const dnr = (browser as unknown as {declarativeNetRequest?:DnrApi}).declarativeNetRequest;
    if (dnr && this.usingDnr) {
      const current = await dnr.getDynamicRules();
      const addRules = this.enabled ? this.engine.toDnrRules() : [];
      await dnr.updateDynamicRules({removeRuleIds:current.map(rule=>rule.id),addRules});
    }
  }
}
