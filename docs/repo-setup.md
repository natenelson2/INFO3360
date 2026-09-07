# Repository setup — Hockey Ops Player Directory

**Author:** Nate Nelson  
**Date:** 2026-09-07  
**Repository URL:** https://github.com/natenelson2/INFO3360  
**Visibility:** public  
**Default branch:** main  

> Course note: this project already has Sprint 1 history on GitHub (`INFO3360`).
> This document records ignore hygiene and browser proof for the known-good
> scaffold state—not a brand-new empty-repo first push.

## 1. Ignore rules in place before first commit

Root `.gitignore` (TanStack Start + Vite) includes:

```text
node_modules/
dist/
dist-ssr/
.output/
.vinxi/
.nitro/
.tanstack/
.wrangler/
.vercel/

# Never commit real env files
.env
.env.local
.env.*.local

# OS / editor noise
.DS_Store
*.log