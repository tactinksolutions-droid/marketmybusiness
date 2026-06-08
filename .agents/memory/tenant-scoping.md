---
name: Tenant scoping & null tenant
description: How tenant resolution works for GrowIQ API routes and the null-tenant edge case to guard.
---

# Tenant scoping

`tenantMiddleware` authenticates the Supabase token, then looks up the business
by `owner_user_id` and sets `req.tenant = business || null`. An authenticated
user with **no business row yet** therefore has `req.tenant === null`.

**Rule:** any route that dereferences `req.tenant.id` must first guard
`if (!req.tenant)` and return an empty/safe payload (e.g. `{ reviews: [] }`),
otherwise it throws a 500 for newly-signed-up users before onboarding completes.

**Why:** onboarding creates the business row only after the summarize-and-confirm
step, so there is a real window where an authed user has no tenant.

**How to apply:** add the null guard to every new tenant-scoped GET/PATCH route.
Several pre-existing routes still assume `req.tenant.id` is non-null — harden them
if you touch them.
