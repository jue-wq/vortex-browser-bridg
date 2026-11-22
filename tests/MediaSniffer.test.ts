import {describe,expect,it} from "vitest";
import {classifyMedia,contentTypeFromHeaders,deduplicateMedia} from "../src/background/MediaSniffer";

describe("MediaSniffer",()=>{
  it.each([
    ["https://cdn.example/video.m3u8","application/vnd.apple.mpegurl","hls"],
    ["https://cdn.example/manifest","APPLICATION/DASH+XML; charset=utf-8","dash"],
    ["https://cdn.example/movie.mp4","application/octet-stream","video"],
    ["https://cdn.example/audio","AUDIO/MP4; codecs=aac","audio"],
    ["file:///tmp/video.mp4","","null"],
    ["javascript:alert(1)","","null"],
    ["https://cdn.example/page.html","text/html","null"]
  ] as const)("classifies %s", (url,mime,expected)=>{
    expect(classifyMedia(url,mime)).toBe(expected==="null"?null:expected);
  });
  it("reads Content-Type case-insensitively and prefers the final response header",()=>{
    expect(contentTypeFromHeaders([{name:"content-type",value:"text/html"},{name:"Content-Type",value:"video/mp4"}])).toBe("video/mp4");
    expect(contentTypeFromHeaders(undefined)).toBe("");
    expect(classifyMedia("https://cdn.example/stream?id=42",contentTypeFromHeaders([{name:"Content-Type",value:"application/vnd.apple.mpegurl"}]))).toBe("hls");
  });
  it("deduplicates identical media URLs per tab but preserves separate tabs",()=>{
    const items=[
      {url:"https://cdn.example/v.mp4#one",kind:"video" as const,tabId:1,seenAt:1},
      {url:"https://cdn.example/v.mp4#two",kind:"video" as const,tabId:1,seenAt:2},
      {url:"https://cdn.example/v.mp4",kind:"video" as const,tabId:2,seenAt:3}
    ];
    expect(deduplicateMedia(items)).toHaveLength(2);
  });
});
