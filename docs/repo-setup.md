Repository setup — Hockey Ops Player Directory

Author: Nate Nelson
Date: 2026-09-07
Repository URL: https://github.com/natenelson2/INFO3360
Visibility: public
Default branch: main  

Why this writeup exists

Hockey Ops needs the directory under version control on GitHub so PAUL and
instructors can grade a real main branch—not only a folder on one laptop.
This file records ignore hygiene, first-commit proof, remote/-u meaning, and
browser checks that the repo on GitHub is clean.

Why ignore rules must exist before the first commit

Git only applies .gitignore to untracked files. If you commit
node_modules/ or a real .env first, those paths enter history even if you
add ignore rules later. Cleaning them out means rewriting history or fighting
tracked files forever. So: write .gitignore → confirm with git status that
secrets and dependencies are absent → then git add / git commit.

What origin is

origin is the default nickname for the remote repository URL (here,
GitHub). Local commands talk to origin; Git resolves that name to
https://github.com/natenelson2/INFO3360.git. You could name remotes anything,
but origin is the convention everyone expects.

What -u does on git push -u origin main

-u (or --set-upstream) tells Git: remember that local main tracks
origin/main. After that first upstream push, later updates are just
git push / git pull without repeating remote and branch names.





1. Ignore rules in place before first commit

Root .gitignore (TanStack Start + Vite) includes at least:

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

.gitignore existed before my first commit: YES
(Early Sprint 1 scaffold already had a root .gitignore. It was expanded so
Start/Vite outputs and env variants stay out of history before Sprint 2 adds
.env.example.)





2. Repository initialized

Default branch is main (Mac project /Users/Nate/Documents/hockey-ops-directory):

$ git branch --show-current
main

(Repo was already initialized for course work; do not re-run git init on a
folder that already has .git.)





3. Pre-stage status review

Representative git status after ignore rules (dependencies installed locally
but not staged):

$ git status
On branch main
Your branch is up to date with 'origin/main'.

nothing to commit, working tree clean

When there are intentional edits, untracked/modified lists show source and
docs—not ignored paths. Checkpoint:





node_modules/ absent from files to commit: PASS



.env / .env.local absent from files to commit: PASS



Build output (dist/, .output/) absent: PASS





4. First commit (proof the tree is under version control)

This course repo’s history on GitHub main includes the scaffold and Sprint 1
work. Recent commits that prove main is live:

e5e50a3 Document repository setup for Hockey Ops on GitHub
91fee04 Add Sprint 1 acceptance checklist with verified evidence
95da8dd Cross-link players and games; polish navigation and empty states
6abbedc SSR seed directory via loaders for home, players, detail, games





First / early scaffold commits landed on main with .gitignore already
present so node_modules and .env were never part of the snapshot.



Working tree clean after each intentional commit/push: PASS





5. Remote and push

$ git remote -v
origin  https://github.com/natenelson2/INFO3360.git (fetch)
origin  https://github.com/natenelson2/INFO3360.git (push)





git push -u origin main (first upstream) or later git push completed
without error for Sprint 1 / this setup commit: PASS



Never paste a personal access token into chat or into this file.





6. Browser verification (the real proof)

Checked on https://github.com/natenelson2/INFO3360 (default branch main):







Check



Result





Source files visible (src/, docs/, package.json, etc.)



PASS





No .env file in the repository



PASS





No node_modules folder in the repository



PASS





Commit messages readable in the commit list



PASS





This file (docs/repo-setup.md) present on main



PASS (after this commit)





7. Issues and fixes







Issue



What I tried



Outcome





Cloud agent remote is Origin, not GitHub



Commit/push from Mac clone to INFO3360 for PAUL



Files appear on GitHub main





Early writeup only listed ignore rules



Expand this doc with status/remote paste, first-commit proof, and origin/-u explanations



Meets step intent





Thin early .gitignore



Add env variants + Start/Vite output dirs



Ready for Sprint 2 .env.example





8. Ready for Sprint 2

Sprint 2 will add env-variable separation and commit .env.example. My repository
is ready for that because ignore rules are already in place and no secret has ever
been committed: YES