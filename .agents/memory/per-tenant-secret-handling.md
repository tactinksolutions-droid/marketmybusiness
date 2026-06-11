---
name: Per-tenant API credential handling
description: How per-business third-party API keys (Gupshup/Brevo/OpenAI/Gemini) are stored and must be kept out of client responses.
---

# Per-tenant API credential handling

Per-business third-party API keys live as columns on the `businesses` table
(`gupshup_api_key`, `brevo_api_key`, `openai_api_key`, `gemini_api_key`). They are
stored **plaintext** (only the DB's at-rest encryption) — there is no app-level
envelope encryption yet. Do not describe them as "encrypted" in UI copy.

**Why plaintext:** per-tenant keys can't go in env vars (those are app-level), so
they must be queryable per row; encryption was deferred as a larger decision
(needs a master-key secret + migrating existing rows).

**How to apply — the leak rule:** `tenantMiddleware` does `select("*")`, so
`req.tenant` carries these keys. Any route that serializes the business row to the
client MUST strip them first (see `sanitizeBusiness()` in `routes/business.ts`).
`req.tenant` keeps the keys server-side so send routes can decide live-vs-simulated.
Never return a credential from `/integrations/connect`, and never log credential
values.
