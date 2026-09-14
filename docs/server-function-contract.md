Server Function Contract — Hockey Operations Directory

Related: docs/boundary-risk-notes.md, docs/client-vs-server-inventory.md
Status: Design only (no app/server/directory.ts implementation in this step)
Stack: TanStack Start server function + server-only Supabase client (app/lib/supabase.server.ts)

Purpose

Load directory rows (players and staff) for the Hockey Operations Directory UI.
Runs only on the server. Uses the server-only Supabase client. Never exposes
service-role keys or other secrets to the browser.

Staff on arena wifi should get a safe JSON list they can render on /players
(and related directory views). Privileged Supabase reads stay in the “back
office” (server function); the browser only receives mapped DirectoryEntry
rows or safe error codes.

Function identity





Suggested export name: getDirectoryEntries



Module (next step): app/server/directory.ts



Kind: TanStack Start server function (server-only entry point the route will call)



Inputs (from the UI / caller)

Inputs define what the route may send. All inputs are optional so the first UI
can request “everything” and later add filters.







Input



Type (plain language)



Rules





search



string



Trim whitespace. Empty or missing means “no text filter.” Match against displayName (case-insensitive).





role



string



One of: "player", "staff", or omit/empty for both. Reject unknown values with a validation error.





limit



number



Optional max rows. Default 100. Clamp between 1 and 200.

Non-inputs (must NOT be accepted from the browser): database passwords,
service-role keys, raw SQL, or “run any query” strings.

Example valid call payloads

{}

{ "search": "smith", "role": "player", "limit": 50 }



Success output

Output fields prevent dumping raw database rows. Return a plain object the UI
can render without further secret access:

type DirectoryEntry = {
  id: string;
  displayName: string;
  role: "player" | "staff";
  teamName: string | null;
  positionOrTitle: string | null;
  isActive: boolean;
};

type GetDirectoryEntriesResult = {
  ok: true;
  entries: DirectoryEntry[];
  // Useful later for empty states and debugging without leaking internals
  meta: {
    count: number;
    appliedFilters: { search: string | null; role: string | null };
  };
};



Field meanings (plain language)







Field



Meaning for the UI





id



Stable string id (React key; links to /players/$playerId when role is player).





displayName



Name shown in the directory list.





role



"player" or "staff" so the UI can label or filter rows.





teamName



Team or unit label, or null if none.





positionOrTitle



Skater/goalie position or staff title, or null.





isActive



Whether the person is currently active on the roster/ops list.



Mapping notes (UI-facing, not raw DB dump)





Map DB columns into the fields above inside pure helpers when possible.



Do not return service keys, auth tokens, or internal Supabase error objects to the client.



Prefer stable id strings the UI can use as React keys.



An empty directory is still success: { ok: true, entries: [], meta: { count: 0, ... } }.



Example success object

{
  "ok": true,
  "entries": [
    {
      "id": "p-17",
      "displayName": "Alex Rivera",
      "role": "player",
      "teamName": "Hockey Ops Practice Squad",
      "positionOrTitle": "C",
      "isActive": true
    },
    {
      "id": "s-3",
      "displayName": "Jordan Lee",
      "role": "staff",
      "teamName": null,
      "positionOrTitle": "Athletic Trainer",
      "isActive": true
    }
  ],
  "meta": {
    "count": 2,
    "appliedFilters": { "search": null, "role": null }
  }
}



Error shapes

Error codes give the UI something to branch on without stack traces. Always
return a structured failure—do not throw raw secrets or stack traces to the
browser.

type GetDirectoryEntriesError = {
  ok: false;
  error: {
    code: "VALIDATION" | "UNAUTHORIZED" | "NOT_FOUND" | "UPSTREAM" | "UNKNOWN";
    message: string; // safe, human-readable, no secrets
  };
};







Situation



code



message guidance





Bad role or limit



VALIDATION



Say which input was invalid; do not echo secrets.





Caller not allowed (future auth)



UNAUTHORIZED



Generic “not allowed”; no internal paths.





No matching row when a future detail call needs one



NOT_FOUND



Reserved for later; list v1 usually returns empty entries instead.





Supabase/network failure



UPSTREAM



“Directory temporarily unavailable.” Log details server-side only.





Unexpected bug



UNKNOWN



Generic failure message; log details server-side only.

Result type: GetDirectoryEntriesResult | GetDirectoryEntriesError (discriminated by ok).

Example validation error

{
  "ok": false,
  "error": {
    "code": "VALIDATION",
    "message": "Invalid role: expected \"player\", \"staff\", or empty."
  }
}



Example upstream error

{
  "ok": false,
  "error": {
    "code": "UPSTREAM",
    "message": "Directory temporarily unavailable."
  }
}



Pure logic vs I/O (critical for later Vitest)

Pure vs I/O is what unlocks Vitest later: tests can run mappers and validators
with fake rows and no real keys.

Pure (no network, no env reads) — extract later into mappers





Normalize and validate inputs (search, role, limit).



Map a raw DB row → DirectoryEntry.



Filter/sort in-memory lists if needed after fetch (e.g., case-insensitive
name match if not pushed to SQL yet).



I/O / server-only





Read server env / use app/lib/supabase.server.ts (getSupabaseServerClient).



Call Supabase to fetch directory rows.



Log detailed errors on the server (never return those details in error.message).



Boundary rules (from prior docs)

Secrets never returned. Rules that implementers must keep:





Service-role and other secret keys: server only (never in the contract’s
return type, never in client bundles). Env name for the secret key:
SUPABASE_SERVICE_ROLE_KEY (not VITE_-prefixed). See .env.example and
app/config/env.ts.



Public anon key / public URL (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY):
may exist for client config elsewhere; this function still uses the
server client for trusted reads as decided in the inventory.



Browser receives only DirectoryEntry data or safe error messages (ok +
error.code / error.message).



Do not import app/lib/supabase.server.ts from client routes or UI components.



Non-goals (out of scope for this function)

Non-goals stop scope creep so Step 7+ stays focused.





Creating, updating, or deleting directory rows



File uploads or images



Full-text search ranking beyond simple name match



Pagination cursors (limit-only is enough for v1)



Auth UI (may add UNAUTHORIZED handling later without changing success shape)



Replacing every seed SSR path in one commit (seed fallback may remain until
a later cutover step)



Implementing app/server/directory.ts in this documentation step



Acceptance checks for implementers (Step 7+)





Function runs only through the server-function path, not as a browser-imported

Supabase call with secrets.



Inputs match the table; unknown role → VALIDATION.



Success payload matches DirectoryEntry fields the directory route can render

(id, displayName, role, teamName, positionOrTitle, isActive).



Failures use ok: false and never include service keys or raw env values.



Pure mappers are identifiable so later Vitest steps can unit-test them without

Supabase.



Traceability





Risks addressed: see docs/boundary-risk-notes.md (secrets off the browser;
trusted reads on server; pure mappers for Vitest).



Placement: see docs/client-vs-server-inventory.md (directory load = server;
render = client; UI sends non-secret filters only).



Env / client modules already in repo: .env.example, app/config/env.ts,
app/lib/supabase.server.ts.

