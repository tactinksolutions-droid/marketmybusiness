---
name: code_execution sandbox has no process.env
description: Where to run Supabase REST / env-dependent commands in this project.
---

# code_execution sandbox has no process.env

The `code_execution` (JS notebook) tool does NOT expose the project's environment variables —
`process.env.SUPABASE_URL` etc. are undefined there. To call Supabase REST or anything that needs
`$SUPABASE_URL` / `$SUPABASE_SERVICE_KEY` / `$DATABASE_URL`, use the `bash` tool, where the env vars
are available. Reserve `code_execution` for registered tool callbacks (webSearch, architect, etc.) and
pure logic.
