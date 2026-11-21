export type MediaKind = "video" | "audio" | "hls" | "dash";
export interface DetectedMedia {url: string; kind: MediaKind; tabId: number; title?: string; seenAt: number;}
export function classifyMedia(url: string, mimeType = ""): MediaKind | null {
  let parsed: URL;
  try { parsed = new URL(url); } catch { return null; }
  if (!["http:", "https:"].includes(parsed.protocol)) return null;
  const path = parsed.pathname.toLowerCase();
  if (path.endsWith(".m3u8") || mimeType.includes("mpegurl")) return "hls";
  if (path.endsWith(".mpd") || mimeType.includes("dash+xml")) return "dash";
  if (mimeType.startsWith("video/") || /\.(mp4|webm|mov|mkv)$/.test(path)) return "video";
  if (mimeType.startsWith("audio/") || /\.(mp3|m4a|aac|ogg|opus|wav)$/.test(path)) return "audio";
  return null;
}
export function deduplicateMedia(items: DetectedMedia[]): DetectedMedia[] {
  const unique = new Map<string, DetectedMedia>();
  for (const item of items) {
    const key = `${item.tabId}:${item.url.split("#")[0]}`;
    if (!unique.has(key)) unique.set(key, item);
  }
  return [...unique.values()];
}
