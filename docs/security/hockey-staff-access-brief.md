# Hockey Staff Access Brief

**Product:** Hockey Ops  
**Sprint:** Sprint 4 — identity and role-bound data access (requirements only)  
**Audience:** Scouts, coaches, medical staff, ops, and engineering  
**Rule of this document:** Requirements and rules only. No login code. No SQL. No package installs. No framework setup.

---

## 1. Problem summary

Hockey operations staff share application tables for day-to-day work. Coaching, scouting, and medical teams often look at the same kinds of records (players, games, events). That does not mean every staff member may see every field.

**Scouting notes** and **sports-science / medical-related data** must not be visible to every staff member. Each group needs different rows and fields from shared tables.

Access rules must hold even if someone calls the API directly, reuses a session token, or skips the normal screens. UI menus alone are not protection.

**Core promise for Sprint 4:** A staff member must only receive the rows and sensitive fields their role is allowed to see. A schema or API change must not silently open a cross-role leak.

---

## 2. Sensitive data (what we protect)

| Data | Why it is sensitive | Example misuse if leaked |
| --- | --- | --- |
| Scouting notes | Competitive intel on players and opponents (draft targets, strengths, weaknesses, private evaluation text) | A non-scout staff member reads draft targets or opponent weaknesses and spreads them outside scouting |
| Sports-science / medical-related measures | Personal performance and health-adjacent staff data used for care and load decisions | Coaching gossip, unfair treatment, or decisions based on medical/science data outside that role’s care scope |

Shared navigation facts (for example a player display name used to open a card) may stay visible when the product needs them. Private note bodies and science measures must stay role-bound.

---

## 3. Staff groups and primary goals

Exactly three staff groups for this brief: **coaching**, **scouting**, and **medical**.

| Staff group | Primary goal in the app | May see (plain language) | Must not see (plain language) |
| --- | --- | --- | --- |
| Coaching | Plan practices and games | Coaching-appropriate operational rows tied to their work (for example roster labels and schedule context the product marks as coaching-safe) | Full scouting note detail; sports-science / medical rows outside coaching scope |
| Scouting | Record and review evaluation notes | Scouting notes for their assignments; player identity needed to label those notes | Sports-science / medical rows; other roles’ private notes outside scouting scope |
| Medical | Track sports-science / medical staff data | Medical / sports-science rows for their care scope; player identity needed to label those rows | Scouting competitive notes; unrelated coaching-only private material |

---

## 4. What must never leak across roles

These are hard rules, not soft preferences.

- A coaching account **must not** read scouting-note rows (or note bodies) that belong only to scouting work.
- A scouting account **must not** read sports-science / medical rows.
- A medical account **must not** read scouting notes.
- A coaching account **must not** write or update scouting notes or medical / sports-science measures outside any narrow product rule stakeholders later approve in writing.
- A scouting account **must not** write or update medical / sports-science measures.
- A medical account **must not** write or update scouting notes.
- Shared “directory” style facts (for example a player display name used for navigation) may be visible when the product needs them. Private note bodies and science measures **must** stay role-bound.
- These rules apply to **read and write** paths, not only to what appears on screen.
- These rules apply to direct API or database access paths the app uses, not only to friendly pages.

---

## 5. Why “hide it in the UI” is not enough

Hiding a menu item or table column only changes what a friendly screen shows. Anyone who can call the API, reuse a session token, or open a network tool might still request the underlying rows.

Real protection needs all three:

1. **Authentication** — prove which staff member is signed in (identity).
2. **Server-side session checks** — server functions re-check that identity before running sensitive queries. Do not trust the browser alone.
3. **Authorization in the database** — PostgreSQL row-level security so each role only receives permitted rows even on direct API or database access paths the app uses.

UI-only hiding is **not** sufficient for scouting notes or sports-science / medical data.

---

## 6. In-scope for this sprint (identity slice)

- Staff sign-in and sign-out with verified sessions.
- Server functions that refuse work when there is no valid session.
- A written role-to-data matrix and RLS policies for coaching, scouting, and medical (to be built from this brief).
- A protected scouting data path that demonstrates filtered reads for the signed-in role.

This document itself is the requirements brief. It does not implement login, SQL, or UI.

---

## 7. Out of scope (later work)

- Full HR onboarding of every employee account.
- Fine-grained edit workflows inside medical charts.
- Mobile-native apps or third-party data warehouse exports.
- Claiming production security sign-off before RLS policies and acceptance checks exist.
- Expanding beyond the three named staff groups unless stakeholders approve a dual-role rule in writing.

---

## 8. Success criteria (how we will know this brief worked)

- A new teammate can name the **three staff groups** (coaching, scouting, medical) and the **two main sensitive data types** (scouting notes; sports-science / medical data) without re-reading the raw client story.
- Every later auth / RLS task can point back to a rule in section 4 of this brief.
- The brief explicitly rejects UI-only hiding as sufficient protection (section 5).
- Stakeholder review can approve or correct this document **before** SQL policies are written.
- Soft language like “should probably not see” is not used for cross-role leaks; rules use **must not**.

---

## 9. Open questions for stakeholders

- Which exact tables (or columns) store scouting notes vs sports-science measures in the current Hockey Ops schema?
- Can any coach also hold a scouting dual-role, or are roles mutually exclusive for v1?
- Who approves emergency break-glass access if medical data is needed outside normal role paths?
- Which player/game fields are shared directory facts for all three roles, and which stay role-bound?
- How should write failures appear to staff when a role tries an action it must not perform (clear error vs silent empty result)?