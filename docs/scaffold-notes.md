# Scaffold notes — hockey ops player directory

## What we generated
- TanStack Start app with React, TypeScript, Vite, and Tailwind CSS
- No player/games product features yet (routes come next)

## Key files
- package.json — dependencies and scripts (`dev`, `build`)
- vite.config.ts — Vite + Start + Tailwind plugins
- tsconfig.json — TypeScript compiler options
- src/styles.css — global styles; `@import 'tailwindcss'` (Tailwind v4 — no tailwind.config.ts)

## How I verified
1. Ran `npm install` after scaffolding.
2. Ran `npm run dev` from `/Users/Nate/Documents/hockey-ops-directory`.
3. Port 3000 was already in use, so Vite used http://localhost:3001/.
4. Opened that URL and confirmed the default page loaded without a crash.

## Layout notes for later steps
- Application source lives under `src/`.
- Routes will be added under `src/routes/` next.
- Requirements live in `docs/requirements-brief.md`.

## Issues hit
- A failed zsh move and early delete removed a temp scaffold once; re-scaffolded successfully.
- Used `cp -R hockey-ops-tmp/. .` to copy files safely.
- Dev server used port 3001 because 3000 was already taken.