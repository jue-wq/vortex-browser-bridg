export type MediaKind = "video" | "audio" | "hls" | "dash";
export interface DetectedMedia {url: string; kind: MediaKind; tabId: number; title?: string; seenAt: number;}
export function classifyMedia(url: string, mimeType = ""): MediaKind | null {
  let parsed: URL;
  try { parsed = new URL(url); } catch { return null; }
  if (!["http:", "https:"].includes(parsed.protocol)) return null;
  const path = parsed.pathname.toLowerCase();
  const mime = mimeType.split(";",1)[0]?.trim().toLowerCase() ?? "";
  if (path.endsWith(".m3u8") || mime.includes("mpegurl")) return "hls";
  if (path.endsWith(".mpd") || mime.includes("dash+xml")) return "dash";
  if (mime.startsWith("video/") || /\.(mp4|webm|mov|mkv)$/.test(path)) return "video";
  if (mime.startsWith("audio/") || /\.(mp3|m4a|aac|ogg|opus|wav)$/.test(path)) return "audio";
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

export function contentTypeFromHeaders(headers: Array<{name: string; value?: string}> | undefined): string {
  if (!headers) return "";
  for (let index = headers.length - 1; index >= 0; index--) {
    const header = headers[index];
    if (header.name.toLowerCase() === "content-type" && typeof header.value === "string") {
      return header.value;
    }
  }
  return "";
}
