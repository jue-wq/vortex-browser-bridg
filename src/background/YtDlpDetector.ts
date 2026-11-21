const KNOWN_HOSTS = new Set([
  "youtube.com", "youtu.be", "youtube-nocookie.com", "twitch.tv", "vimeo.com",
  "x.com", "twitter.com", "reddit.com", "tiktok.com", "bilibili.com", "soundcloud.com"
]);
export interface YtDlpDetection {supported: boolean; host: string; playlist: boolean;}
export function detectYtDlpPage(input: string, customDomains: string[] = []): YtDlpDetection {
  const url = new URL(input);
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  const allDomains = [...KNOWN_HOSTS, ...customDomains.map(value => value.toLowerCase())];
  const supported = allDomains.some(domain => host === domain || host.endsWith(`.${domain}`));
  const playlist = url.searchParams.has("list") || url.searchParams.has("playlist") || url.pathname.includes("/playlist");
  return {supported, host, playlist};
}
