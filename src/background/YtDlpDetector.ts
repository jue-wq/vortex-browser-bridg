const KNOWN_HOSTS = new Set([
  "youtube.com", "youtu.be", "youtube-nocookie.com", "twitch.tv", "vimeo.com",
  "x.com", "twitter.com", "reddit.com", "tiktok.com", "bilibili.com", "soundcloud.com"
]);
export interface YtDlpDetection {supported: boolean; host: string; playlist: boolean;}
export function detectYtDlpPage(input: string, customDomains: string[] = []): YtDlpDetection {
  let url: URL;
  try { url = new URL(input); } catch { return {supported:false,host:"",playlist:false}; }
  if (!["http:","https:"].includes(url.protocol)) return {supported:false,host:url.hostname.toLowerCase(),playlist:false};
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  const allDomains = [...KNOWN_HOSTS, ...customDomains.map(value => value.toLowerCase())];
  const supported = allDomains.some(domain => host === domain || host.endsWith(`.${domain}`));
  const playlist = url.searchParams.has("list") || url.searchParams.has("playlist") || url.pathname.includes("/playlist");
  return {supported, host, playlist};
}
