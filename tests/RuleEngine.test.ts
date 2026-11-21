import {describe,expect,it} from "vitest";
import {decideCapture,defaultInterceptionSettings} from "../src/background/RuleEngine";
describe("RuleEngine",()=>{
  it("captures a valid HTTP download",()=>expect(decideCapture({url:"https://example.com/file.zip"},defaultInterceptionSettings).capture).toBe(true));
  it("rejects a non-http scheme",()=>expect(decideCapture({url:"javascript:alert(1)"},defaultInterceptionSettings).reason).toBe("scheme"));
  it("honors the excluded domain list",()=>expect(decideCapture({url:"https://sub.example.com/a"}, {...defaultInterceptionSettings,excludedDomains:["example.com"]}).reason).toBe("excluded-domain"));
  it("honors minimum size",()=>expect(decideCapture({url:"https://example.com/a",totalBytes:10}, {...defaultInterceptionSettings,minSizeBytes:20}).reason).toBe("below-size"));
  it("honors incognito policy",()=>expect(decideCapture({url:"https://example.com/a",incognito:true},defaultInterceptionSettings).reason).toBe("incognito"));
  it("normalizes configured domain case, whitespace and dots",()=>expect(decideCapture({url:"https://cdn.example.com/file"}, {...defaultInterceptionSettings,excludedDomains:[" .EXAMPLE.com. "]}).reason).toBe("excluded-domain"));
  it("does not confuse suffix lookalikes with subdomains",()=>expect(decideCapture({url:"https://notexample.com/file"}, {...defaultInterceptionSettings,excludedDomains:["example.com"]}).capture).toBe(true));
  it("honors allowed domain subdomains",()=>expect(decideCapture({url:"https://cdn.example.com/file"}, {...defaultInterceptionSettings,allowedDomains:["example.com"]}).capture).toBe(true));
  it("normalizes extension filters with a leading dot",()=>expect(decideCapture({url:"https://example.com/archive.ZIP"}, {...defaultInterceptionSettings,includedExtensions:[".zip"]}).capture).toBe(true));
  it("normalizes MIME case and ignores parameters",()=>expect(decideCapture({url:"https://example.com/file",mimeType:"APPLICATION/ZIP; charset=binary"}, {...defaultInterceptionSettings,includedMimeTypes:["application/zip"]}).capture).toBe(true));
  it("does not capture when disabled",()=>expect(decideCapture({url:"https://example.com/a"}, {...defaultInterceptionSettings,enabled:false}).reason).toBe("disabled"));
  it("honors bypass",()=>expect(decideCapture({url:"https://example.com/a"}, {...defaultInterceptionSettings,bypassPressed:true}).reason).toBe("bypass"));
  it("rejects malformed URLs",()=>expect(decideCapture({url:"not a url"},defaultInterceptionSettings).reason).toBe("invalid-url"));
  it("allows exact minimum size",()=>expect(decideCapture({url:"https://example.com/a",totalBytes:20},{...defaultInterceptionSettings,minSizeBytes:20}).capture).toBe(true));
  it("rejects a non-allowed domain",()=>expect(decideCapture({url:"https://other.example/a"},{...defaultInterceptionSettings,allowedDomains:["trusted.example"]}).reason).toBe("not-allowed-domain"));
  it("rejects unmatched extension and MIME filters",()=>expect(decideCapture({url:"https://example.com/file.txt"},{...defaultInterceptionSettings,includedExtensions:["zip"],includedMimeTypes:["application/zip"]}).reason).toBe("type-not-included"));
  it("matches the filename extension over URL path",()=>expect(decideCapture({url:"https://example.com/download?id=1",filename:"movie.MP4"},{...defaultInterceptionSettings,includedExtensions:["mp4"]}).capture).toBe(true));
  it("rejects FTP URLs",()=>expect(decideCapture({url:"ftp://example.com/file"},defaultInterceptionSettings).reason).toBe("scheme"));
  it("rejects data URLs",()=>expect(decideCapture({url:"data:text/plain,hello"},defaultInterceptionSettings).reason).toBe("scheme"));
  it("allows HTTP as well as HTTPS",()=>expect(decideCapture({url:"http://example.com/file"},defaultInterceptionSettings).capture).toBe(true));

});
