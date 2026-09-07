# Vercel Hobby setup — hockey ops directory

**Date:** 2026-09-07  
**Vercel plan:** Hobby (free) — not Pro  

## URLs (the same ones you will reuse all semester)

| Item | Value |
| --- | --- |
| GitHub repository (you can push) | `https://github.com/natenelson2/INFO3360` |
| Instructor collaborator | `thortek` added: yes / no ← confirm in GitHub Settings → Collaborators |
| Vercel Production URL | `https://info-3360.vercel.app` |
| Preview URLs | Do **not** submit these to Canvas |

## Hobby constraints I will keep

- One Vercel project for this course (do not click Add New Project again later)
- Production deploys from `main` only
- No cron / paid add-ons; avoid Pro-only toggles
- Secrets go in the Vercel dashboard later — never in git
- Keep TanStack Start SSR via Nitro (`nitro` in `vite.config.ts`) — never “fix” deploy with static-only `outputDirectory: "dist"`

## First production deploy

- Status: **Ready**
- Incognito check of Production URL: **pass** (Hockey Ops directory content at Production URL; not the Vercel dashboard)
- Nitro plugin committed on `main` before / for production SSR support

## Notes

- Framework on import: Vite (auto-detect) with root `./` — left Build/Output settings alone
- Production branch: `main`
- Reuse this same project and Production URL for the rest of the semester