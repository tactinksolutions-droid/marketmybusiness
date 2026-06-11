---
name: Analytics honesty in spec adaptation
description: When adapting pasted UI specs into MarketMyBusiness, displayed metric values must match their labels — no faked or mislabeled numbers.
---

When adapting the pasted "module" specs (written for a different stack), the spec
often wires a generic aggregate into a specifically-labeled metric slot (e.g. a
WhatsApp card labeled "Messages sent" fed by the total campaign *count*, or a GMB
card labeled "Views/Calls/Directions" showing the post count).

**Rule:** every number rendered must match its label or be shown as `"—"`. Never
reuse an aggregate count under a more specific label.

**Why:** the project's honesty bar forbids fake/misleading analytics; architect
code_review will FAIL the module on label/value mismatches.

**How to apply:** for real per-channel numbers, aggregate server-side in
`GET /api/analytics/summary` (it returns `channelStats: Record<channel,{sent,read,campaigns}>`
summed from `campaigns` for the tenant). Derive "messages sent" from summed
`total_sent` and "open rate" from `read/sent`; leave untracked metrics as `"—"`.
Also: a manual "Sync now" refetch must not blank already-loaded data on failure —
keep the stale data and show a non-blocking banner.
