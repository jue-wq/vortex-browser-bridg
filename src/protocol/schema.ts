import { z } from "zod";

export const cookieSchema = z.object({
  name: z.string(), value: z.string(), domain: z.string(), path: z.string(),
  secure: z.boolean(), http_only: z.boolean(), expires: z.number().optional()
}).strict();

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
  cookies: z.array(cookieSchema),
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
  playlist_mode: z.enum(["single", "playlist", "ask"])
}).strict();

export const addBatchPayloadSchema = z.object({
  items: z.array(z.object({url: z.string().url(), filename: z.string().optional(), headers: z.record(z.string()).optional()}).strict()),
  source_page: z.string().url(),
  queue_id: z.string().optional()
}).strict();

export const taskControlPayloadSchema = z.object({
  action: z.enum(["pause", "resume", "cancel", "focus_app"]),
  task_id: z.string().optional()
}).strict();

export type IpcEnvelope = z.infer<typeof envelopeSchema>;
export type CookiePayload = z.infer<typeof cookieSchema>;
export type AddDownloadPayload = z.infer<typeof addDownloadPayloadSchema>;
export type OutgoingMessageType = "handshake" | "add_download" | "extract_media" | "add_batch" | "task_control";

export function validateEnvelope(input: unknown): IpcEnvelope {
  return envelopeSchema.parse(input);
}

export function makeEnvelope<T extends Record<string, unknown>>(
  type: OutgoingMessageType, requestId: string, payload: T
): IpcEnvelope {
  return {protocol_version: 1, type, request_id: requestId, timestamp: Math.floor(Date.now() / 1000), payload};
}
