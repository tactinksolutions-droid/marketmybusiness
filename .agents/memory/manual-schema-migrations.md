---
name: Manual schema migrations & DB error checking
description: GrowIQ's Supabase schema is applied by hand, so new columns may not exist yet — routes must check Supabase errors.
---

# Manual schema migrations

`supabase/schema.sql` is the source of truth but is **run by the user manually**
in the Supabase SQL editor — there is no automated push. When you add a column,
add it both to the `CREATE TABLE` (for fresh installs) **and** as an idempotent
`ALTER TABLE ... ADD COLUMN IF NOT EXISTS` (for the user's existing database),
then tell the user to run the new statements.

**Why it bites:** there is a real window where the code references a column the
live DB does not have yet.

**Rule:** every route that writes via `supabaseAdmin...update/insert` must
destructure and check `{ error }` and return a non-2xx on failure. A Supabase
update against a missing column does **not** throw — it returns `{ error }` while
the row count is 0, so ignoring it silently reports success and the UI shows a
fake "connected"/"saved" state.
