export interface BatchChunk {
  chunk_id: string;
  chunk_index: number;
  chunk_total: number;
  chunk_data: string;
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, Math.min(offset + 0x8000, bytes.length)));
  }
  return btoa(binary);
}

export function chunkBatch(
  items: unknown[], sourcePage: string, chunkId: string, maxBytes = 256 * 1024
): BatchChunk[] {
  if (!Number.isInteger(maxBytes) || maxBytes < 1024 || maxBytes > 256 * 1024) {
    throw new RangeError("maxBytes must be between 1 KiB and 256 KiB");
  }
  const encoder = new TextEncoder();
  const serialized = encoder.encode(JSON.stringify({items, source_page: sourcePage}));
  const parts: Uint8Array[] = [];
  for (let offset = 0; offset < serialized.length; offset += maxBytes) {
    parts.push(serialized.slice(offset, Math.min(offset + maxBytes, serialized.length)));
  }
  const total = Math.max(parts.length, 1);
  return parts.map((part, index) => ({
    chunk_id: chunkId, chunk_index: index, chunk_total: total, chunk_data: toBase64(part)
  }));
}
