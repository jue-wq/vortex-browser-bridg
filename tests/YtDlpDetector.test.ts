import {describe,expect,it} from "vitest";
import {detectYtDlpPage} from "../src/background/YtDlpDetector";

describe("YtDlpDetector",()=>{
  it("recognizes known media hosts and playlist URLs",()=>{
    expect(detectYtDlpPage("https://www.youtube.com/watch?v=1&list=abc")).toEqual({supported:true,host:"youtube.com",playlist:true});
  });
  it("matches known subdomains but not suffix lookalikes",()=>{
    expect(detectYtDlpPage("https://m.twitch.tv/stream").supported).toBe(true);
    expect(detectYtDlpPage("https://twitch.tv.evil.test/").supported).toBe(false);
  });
  it("supports explicitly configured hostnames",()=>{
    expect(detectYtDlpPage("https://media.example.test/v",["example.test"]).supported).toBe(true);
  });
  it("does not throw on malformed or unsupported URLs",()=>{
    expect(detectYtDlpPage("not a URL").supported).toBe(false);
    expect(detectYtDlpPage("file:///tmp/video").supported).toBe(false);
  });
});
