import {describe,expect,it} from "vitest";
import {decideCapture,defaultInterceptionSettings} from "../src/background/RuleEngine";
describe("RuleEngine",()=>{
  it("captures a valid HTTP download",()=>expect(decideCapture({url:"https://example.com/file.zip"},defaultInterceptionSettings).capture).toBe(true));
  it("rejects a non-http scheme",()=>expect(decideCapture({url:"javascript:alert(1)"},defaultInterceptionSettings).reason).toBe("scheme"));
  it("honors the excluded domain list",()=>expect(decideCapture({url:"https://sub.example.com/a"}, {...defaultInterceptionSettings,excludedDomains:["example.com"]}).reason).toBe("excluded-domain"));
  it("honors minimum size",()=>expect(decideCapture({url:"https://example.com/a",totalBytes:10}, {...defaultInterceptionSettings,minSizeBytes:20}).reason).toBe("below-size"));
  it("honors incognito policy",()=>expect(decideCapture({url:"https://example.com/a",incognito:true},defaultInterceptionSettings).reason).toBe("incognito"));
});
