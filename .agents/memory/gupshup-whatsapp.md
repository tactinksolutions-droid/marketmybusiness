---
name: Gupshup WhatsApp sending
description: How real WhatsApp sending works via Gupshup (templates vs free-text) and the account-specific config it needs.
---

# Gupshup WhatsApp sending

- Business-initiated WhatsApp messages MUST use an **approved template**, not free text.
  Free-text only works inside an active 24h session (user messaged you recently).
- **Send template:** `POST https://api.gupshup.io/wa/api/v1/template/msg`, header `apikey`,
  body x-www-form-urlencoded: `channel=whatsapp`, `source` (sender number, country code no +),
  `destination`, `src.name` (app name), `template={"id":"<UUID>","params":[...]}`.
  Async → returns `{status:"submitted", messageId}`. The `/sm/api/v1/msg` free-text endpoint is DEPRECATED.
- **List templates (resolve name→UUID):** `GET https://api.gupshup.io/wa/app/{appId}/template`, header `apikey`.
  Returns `templates[]` with `id` (sending UUID), `elementName` (friendly name like "whatsapp_test1"),
  `data` (body with `{{1}}` placeholders), `status` (use only `APPROVED`).
- Account-specific values required to send, beyond the API key: **sender number, app name, app id.**
  Stored per-business in non-secret columns `gupshup_source_number / gupshup_app_name / gupshup_app_id`
  (api key stays in sensitive `gupshup_api_key`, never returned to client). UI to set + test: WhatsAppTester in IntegrationsView.

- **Test-number gotcha:** a Meta WhatsApp *test* number (e.g. `15559897755`, business entity ends in "Test")
  only delivers to recipients manually added + OTP-verified in Meta (max 5). Gupshup still returns
  `202 {status:"submitted"}` for non-allowlisted numbers, but Meta silently drops them — "submitted" ≠ delivered.
  Real delivery to arbitrary contacts needs a live, business-verified number. Get true delivery status via the
  DLR webhook (`type:"message-event"` → enqueued/sent/delivered/read/**failed** with reason).

**Why:** the user only knows the template NAME; the API needs the UUID, so we look it up via app id.
**Outstanding:** campaign live-send (`sendCampaign`/`sendWhatsAppMessage`) still uses the deprecated
free-text path and env-only source/app — not migrated to templates. Convert before relying on cold campaigns.
