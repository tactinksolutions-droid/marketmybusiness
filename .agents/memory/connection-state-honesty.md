---
name: Connection-state honesty
description: A channel's *_connected flag must require real proof (API key or OAuth) — never a plain flag-flip endpoint.
---

A business's `<channel>_connected` flag must only become true after the owner
provides real proof of connection:

- **Key-based channels** (whatsapp, email, chatgpt, gemini): set via
  `POST /integrations/connect` which stores the credential AND sets the flag.
- **Meta (instagram, facebook)**: set only by the OAuth callback after a real
  token exchange (`/integrations/meta/start` → Facebook → `/meta/callback`).

**Rule:** do NOT add a generic `POST /business/connect/:platform` flag-flip
route. It was removed because any authenticated tenant could forge a "connected"
status with no credential/OAuth. Only `/disconnect/:platform` (flag→false) is a
safe unproven action.

**Why:** the project's honesty bar forbids fake connections; architect
code_review FAILS the build if connected state can be forged. Pasted specs
(written for another stack) often re-introduce this — SetupScreen/SettingsView
both originally fake-connected via the flag-flip route.

**How to apply:** onboarding/settings screens must funnel owners to the real
Integrations page (key modal or "Continue with Facebook"), never call a
flag-flip connect. OAuth `state` is HMAC-signed with `SESSION_SECRET`
(node:crypto, no jsonwebtoken dep); `metaConfigured()` requires
FB_APP_ID + FB_APP_SECRET + SESSION_SECRET + REPLIT_DOMAINS so it fails closed.
