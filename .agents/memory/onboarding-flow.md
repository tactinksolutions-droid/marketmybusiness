---
name: GrowIQ onboarding flow
description: How chat onboarding collects the business profile before a business row exists
---

# GrowIQ onboarding flow

Onboarding runs through the AI chat (`onboard()` in `claudeService.ts`), invoked from `routes/chat.ts` when `req.tenant` is null / `onboarding_complete` is false.

## Decisions / constraints
- **No DB row exists yet during onboarding**, so chat history cannot be persisted/fetched server-side. The frontend (`useChat.ts`) sends the full conversation `history` with every `/chat` request, and the backend uses that client-supplied history for the prompt.
  - **Why:** without it, each turn got empty history and Claude restarted from question 1.
  - **How to apply:** the history is untrusted input — keep the server-side validation (array-only, role enum, content string, slice cap) in the onboarding branch of `routes/chat.ts`.
- **Onboarding requires an explicit summarize-and-confirm step** before emitting the final `{"done":true,...}` JSON.
  - **Why:** the profile JSON has 7 fields (incl. splitting city vs locality) derived from 6 questions; Claude mismatched fields ("collation not coming right") when it finalized blind. The confirm step lets the user verify/correct first.
- Final-JSON detection extracts the `{...}` containing `"done"` via regex (don't rely on the whole reply being pure JSON).

## Auth note
- Login is **email + password** (Supabase), not magic link — magic link hit Supabase's free-tier email rate limit. Requires "Confirm email" turned OFF in Supabase Auth for immediate sign-in.
