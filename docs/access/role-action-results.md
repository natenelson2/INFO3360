# Role action results

Proof table for the least-privilege break-tests. Status reflects the official one-shot run, not a watch session.

## How to read this table

- **Pass** — the run matched the matrix: blocked when Expected is deny; readable when Expected is allow.
- **Fail** — the run contradicted the matrix, or the case did not execute so the gate was never judged.
- Inversion rule: blocked + should-deny = Pass. Visible + should-deny = Fail. Readable + should-allow = Pass. Blocked + should-allow = Fail. Skipped / not signed in = Fail (not proven).

## Run command

```bash
npx vitest run tests/access/least-privilege-roles.test.ts