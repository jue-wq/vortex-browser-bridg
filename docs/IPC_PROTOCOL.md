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
| Extension → App | `add_download` | `url`, `headers`, `cookies[]`, `auto_start`; optional filename, referrer, download_page, queue_id | `ack`: task_id, accepted |
| Extension → App | `extract_media` | `webpage_url`, `page_title`, `user_agent`, `cookies[]`, `playlist_mode` (`single`/`playlist`/`ask`) | `ack`: dialog_opened |
| Extension → App | `add_batch` | `items[]`, `source_page`; optional queue_id | `ack`: count |
| Extension → App | `task_control` | `action` (`pause`/`resume`/`cancel`/`focus_app`); optional task_id | `ack` |
| App → Extension | `status_update` | `active_count`, `total_speed_bps`, `theme`, up to 10 active_tasks summaries | Popup/badge refresh |
| App → Extension | `queues_sync` | `queues[]`, `categories[]` | Context menu and batch targets refresh |
| Either → Either | `ack` | `accepted` plus message-specific fields | Correlated result |
| Either → Either | `error` | `code`, `message` | Correlated failure |

Headers are string maps. Cookie objects are transient and must never be persisted or logged.

## Framing and chunking
Native Messaging uses a 4-byte unsigned little-endian byte length followed by exactly that many UTF-8 JSON bytes. Reject zero-length and >1 MiB frames. Large batches are split into `add_batch_chunk` payloads with `chunk_id`, zero-based `chunk_index`, `chunk_total`, and base64 `chunk_data`; each data chunk is at most 256 KiB. Reject inconsistent/duplicate chunks and expire incomplete assemblies after 30 seconds.

## Safety invariants
1. Accept protocol v1 only and validate every external message.
2. Permit only HTTP(S) download URLs; any HTTP fallback is loopback-only and opt-in.
3. Cookies are read only after an explicit user action, remain memory-only, and are never logged.
4. Browser downloads are cancelled only after an `ack` within 1,500 ms; otherwise browser download continues untouched.
5. Never log API keys, authorization headers, or cookie values.
6. Handle repeated request IDs idempotently where practical.
