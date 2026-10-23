# Service-role key rule

## What this key is

The service-role key is the master key for the database project. It skips row-level security. It can read medical and sports-science rows that a normal staff login must not see. Because of that, scout and analyst requests must never use it, even to load a shared view and then hide a medical flag.

## Default deny

If a job is not named on the allowed list below, it must not use this key.

## Allowed server-only jobs

Only the jobs named here may use the key. If you have no such job, write none. Do not invent a job.

### none

- Why a normal staff login is not enough: not applicable — allowed list is none
- Runs on the server, not in a staff browser: not applicable
- Does not serve the assistant scout or the video analyst: not applicable
- Does not open medical or sports-science data to those roles: not applicable

No server-only job is authorized by this rule to use the service-role key. "So the page works" is not an allowed reason. Everyday directory, scouting, game, and staff screens must use a normal signed-in staff path (or fail closed), not this master key.

## Never allowed

- Assistant scout screens, and any server code that answers those screens
- Video analyst screens, and any server code that answers those screens
- Everyday staff screens in the browser
- Using the key to read a medical flag so a shared view can hide it
- Sign-in checks, scouting reads, and game reads
- Directory or other "make the page work" reads that skip staff login
- Any job not named on the allowed list
- Browser code, front-end bundles, or client env files that try to hold or call this key

## Sealed even if a screen is buggy

Medical and sports-science data, including medical flags in a shared view, stay sealed for the assistant scout and the video analyst. Those requests must not use this key. If a staff screen is buggy or missing a filter, the request must fail closed without opening the master key. Fail closed means refuse the request. It does not mean read sealed rows with the key and then try to hide the extra data.

## Tied to the brief and the audit

- Brief: `docs/access/new-roles-brief.md`
- Audit: `docs/access/overgrant-audit.md`
- Audit finding, in the audit's own words: "Service-role uses noticed, with no rule written here: `app/lib/supabase.server.ts` builds a client with `SUPABASE_SERVICE_ROLE_KEY`; `app/server/directory.ts` uses it to read `directory_entries`. `src/lib/supabase/server.ts` states it does not use the service-role key. No policy or rule is decided in this file."
- How this rule closes that risk: Default deny means no job is authorized here to keep or expand service-role use. Scout, analyst, browser, and medical-flag-hide paths are explicitly never allowed, so a later change cannot "helpfully" route those screens through the master key. Existing directory use named in the audit is not added to the allow list; it must not become a pattern for sealed data.

## Where the secret lives

The real key is not in this file. It stays in server settings, outside the project. Do not paste the key, a token, or a connection string here. Do not commit the real secret into git.