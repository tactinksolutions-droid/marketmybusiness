---
name: Supabase schema is applied by hand
description: Why DB migrations in this project must be run manually in Supabase, not via psql/DATABASE_URL.
---

# Supabase schema is applied by hand

The app's data lives in **Supabase Postgres**, but `DATABASE_URL` (and the `psql` binary) point to
Replit's built-in Postgres — a different, empty DB. Running DDL with `psql "$DATABASE_URL"` fails with
`relation "businesses" does not exist`. The Supabase service key is NOT the Postgres password, and
Supabase REST/PostgREST cannot run DDL.

**Why:** no Supabase Postgres connection string is available in env.
**How to apply:** keep `supabase/schema.sql` as the idempotent source of truth (`ALTER TABLE ... ADD COLUMN IF NOT EXISTS`),
then have the user run the new statements in the Supabase SQL editor. Verify a column exists via REST:
`GET $SUPABASE_URL/rest/v1/businesses?select=<col>&limit=1` (error code 42703 = column missing).
