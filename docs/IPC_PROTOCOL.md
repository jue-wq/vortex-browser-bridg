# IPC_PROTOCOL v1

This file is the normative shared contract between VortexDM and Vortex Browser Bridge. Both repositories must change it and the matching implementation together.

## Envelope
Every message is a UTF-8 JSON object with these required fields:
```json
{"protocol_version":1,"type":"handshake","request_id":"unique-id","timestamp":1795305600,"payload":{}}
```
- `protocol_version`: integer `1`; incompatible versions are rejected.
- `type`: message type below.
- `request_id`: non-empty correlation identifier echoed by the response.
- `timestamp`: Unix epoch seconds.
- `payload`: object validated by both endpoints.

## Message catalogue

| Direction | Type | Payload | Response |
|---|---|---|---|
| Extension → App | `handshake` | `ext_version`, `browser`, `capabilities[]` | `app_version`, `theme`, `ytdlp_ready`, `queues[]` |
| Extension → App | `add_download` | `url`, `headers`, `auto_start`; optional filename, referrer, download_page, queue_id | `ack`: task_id, accepted |
| Extension → App | `extract_media` | `webpage_url`, `page_title`, `user_agent`, `playlist_mode` (`single`/`playlist`); optional queue_id | `ack`: task_id, accepted; requires an active yt-dlp profile |
| Extension → App | `add_batch` | `items[]`, `source_page`; optional queue_id | `ack`: count |
| Extension → App | `add_batch_chunk` | `chunk_id`, `chunk_index`, `chunk_total`, base64 `chunk_data` | `ack`: accepted, task_ids/count when final chunk is assembled |
| Extension → App | `task_control` | `action` (`pause`/`resume`/`cancel`), `task_id` | `ack`: accepted, task_id, resulting status |
| Extension → App | `task_status` | optional `limit` (1–50, default 20) | `ack`: recent task IDs, filenames, statuses and byte progress |
| Either → Either | `ack` | `accepted` plus message-specific fields | Correlated result |
| Either → Either | `error` | `code`, `message` | Correlated failure |

Task status is synchronized by extension polling (`task_status`) while the popup is open; unsolicited `status_update` or `queues_sync` push messages are not implemented. Headers are currently empty for browser-captured tasks; authorization/session headers are not forwarded. Media extraction sends only page URL/title/playlist mode and selected queue.

## Framing and chunking
Native Messaging uses a 4-byte unsigned little-endian byte length followed by exactly that many UTF-8 JSON bytes. Reject zero-length and >1 MiB frames. Large batches are split into `add_batch_chunk` payloads with `chunk_id`, zero-based `chunk_index`, `chunk_total`, and base64 `chunk_data`; each data chunk is at most 256 KiB. Reject inconsistent/duplicate chunks and expire incomplete assemblies after 30 seconds.

The Android fallback uses HTTP on `127.0.0.1` only, with a per-launch random API key, CORS preflight and a bounded JSON body. It is opt-in and is not exposed on the LAN.

## Safety invariants
1. Accept protocol v1 only and validate every external message.
2. Permit only HTTP(S) download URLs; any HTTP fallback is loopback-only and opt-in.
3. The extension does not request the browser cookies permission and never reads, sends, stores or logs cookie values.
4. Browser downloads are cancelled only after an `ack` within 1,500 ms; otherwise the browser download continues untouched.
5. Never log API keys or authorization data.
6. Handle repeated request IDs idempotently where practical.
7. Android ad blocking is performed by the original uBlock Origin add-on in Firefox for Android; Bridge filtering is disabled on Android.
