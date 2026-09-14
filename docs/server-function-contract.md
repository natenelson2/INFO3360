# Server Function Contract — Hockey Operations Directory

**Related:** `docs/boundary-risk-notes.md`, `docs/client-vs-server-inventory.md`  
**Status:** Design only (no `app/server/directory.ts` implementation in this step)  
**Stack:** TanStack Start server function + server-only Supabase client (`app/lib/supabase.server.ts`)

## Purpose

Load directory rows (players and staff) for the Hockey Operations Directory UI.
Runs only on the server. Uses the server-only Supabase client. Never exposes
service-role keys or other secrets to the browser.

Staff on arena wifi should get a safe JSON list they can render on `/players`
(and related directory views). Privileged Supabase reads stay in the “back
office” (server function); the browser only receives mapped `DirectoryEntry`
rows or safe error codes.

## Function identity

- **Suggested export name:** `getDirectoryEntries`
- **Module (next step):** `app/server/directory.ts`
- **Kind:** TanStack Start server function (server-only entry point the route will call)

## Inputs (from the UI / caller)

Inputs define what the route may send. All inputs are optional so the first UI
can request “everything” and later add filters.

| Input | Type (plain language) | Rules |
| --- | --- | --- |
| `search` | string | Trim whitespace. Empty or missing means “no text filter.” Match against `displayName` (case-insensitive). |
| `role` | string | One of: `"player"`, `"staff"`, or omit/empty for both. Reject unknown values with a validation error. |
| `limit` | number | Optional max rows. Default `100`. Clamp between `1` and `200`. |

**Non-inputs (must NOT be accepted from the browser):** database passwords,
service-role keys, raw SQL, or “run any query” strings.

### Example valid call payloads

```json
{}