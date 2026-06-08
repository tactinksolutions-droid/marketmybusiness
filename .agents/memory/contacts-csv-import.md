---
name: Contacts CSV import dedupe semantics
description: How GrowIQ contact import dedupes, and why the frontend omits empty phone fields
---

The `/contacts/import` upsert dedupes on `(business_id, phone)` with `ignoreDuplicates: true`.

**Consequences:**
- Email-only contacts (no phone) do NOT dedupe — re-importing the same email-only rows creates duplicates. This is accepted for the MVP.
- The frontend CSV parser omits the `phone` field entirely when empty (rather than sending `""`). 

**Why:** an empty-string phone would collide on the `(business_id, phone)` unique key, so many distinct email-only rows would collapse into one unpredictably. Omitting the field stores NULL, and NULLs are distinct under the unique constraint, so each email-only contact is preserved.

**How to apply:** if you later want email-based dedupe, add a server-side fallback (e.g. dedupe by email when phone is null) — do not just start sending empty-string phones from the client.
