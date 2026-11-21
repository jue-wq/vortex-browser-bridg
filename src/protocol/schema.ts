import { z } from "zod";

export const envelopeSchema = z.object({
  protocol_version: z.literal(1),
  type: z.string().min(1),
  request_id: z.string().min(1),
  timestamp: z.number().int().nonnegative(),
  payload: z.record(z.unknown())
}).strict();

export const handshakePayloadSchema = z.object({
  ext_version: z.string().min(1),
  browser: z.enum(["chrome", "edge", "brave", "vivaldi", "firefox"]),
  capabilities: z.array(z.string())
}).strict();

export const addDownloadPayloadSchema = z.object({
  url: z.string().url(),
  filename: z.string().optional(),
  headers: z.record(z.string()),
  referrer: z.string().url().optional(),
  download_page: z.string().url().optional(),
  auto_start: z.boolean(),
  queue_id: z.string().optional()
}).strict().superRefine((value, ctx) => {
  if (!["http:", "https:"].includes(new URL(value.url).protocol)) {
    ctx.addIssue({code: z.ZodIssueCode.custom, path: ["url"], message: "Only HTTP(S) URLs are allowed"});
  }
});

export const extractMediaPayloadSchema = z.object({
  webpage_url: z.string().url(),
  page_title: z.string(),
  user_agent: z.string(),
  cookies: z.array(cookieSchema),
  playlist_mode: z.enum(["single", "playlist", "ask"]),
  queue_id: z.string().optional()
}).strict();

export const addBatchPayloadSchema = z.object({
  items: z.array(z.object({url: z.string().url(), filename: z.string().optional(), headers: z.record(z.string()).optional()}).strict()),
  source_page: z.string().url(),
  queue_id: z.string().optional()
}).strict();

export const addBatchChunkPayloadSchema = z.object({
  chunk_id: z.string().min(1).max(128),
  chunk_index: z.number().int().min(0).max(127),
  chunk_total: z.number().int().min(1).max(128),
  chunk_data: z.string().min(4)
}).strict().superRefine((value, ctx) => {
  if (value.chunk_index >= value.chunk_total) ctx.addIssue({code:z.ZodIssueCode.custom,path:["chunk_index"],message:"chunk_index must be below chunk_total"});
});

export const taskControlPayloadSchema = z.object({
  action: z.enum(["pause", "resume", "cancel", "focus_app"]),
  task_id: z.string().optional()
}).strict();

export type IpcEnvelope = z.infer<typeof envelopeSchema>;
export type AddDownloadPayload = z.infer<typeof addDownloadPayloadSchema>;
export type AddBatchPayload = z.infer<typeof addBatchPayloadSchema>;
export type OutgoingMessageType = "handshake" | "add_download" | "extract_media" | "add_batch" | "add_batch_chunk" | "task_control";

export function validateEnvelope(input: unknown): IpcEnvelope {
  return envelopeSchema.parse(input);
}

export function makeEnvelope<T extends Record<string, unknown>>(
  type: OutgoingMessageType, requestId: string, payload: T
): IpcEnvelope {
  return {protocol_version: 1, type, request_id: requestId, timestamp: Math.floor(Date.now() / 1000), payload};
}
