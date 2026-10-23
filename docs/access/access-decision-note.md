# Access decision note: mid-season staff roles

**Audience:** Hockey operations lead (approval page, not a how-to for staff login)  
**Decision:** Approve access for two mid-season hires without opening medical or sports-science data.

---

## The request

Hockey operations hired two new jobs mid-season: an **assistant scout** and a **video analyst**. They need enough scouting and game information to do their work. They must not receive medical records, sports-science measures, or health labels on shared screens. Existing coaching, scouting, and medical rules stay as they are.

---

## Who may see what

### Assistant scout

- **May see and update:** Scouting notes for the players on the caseload they support (look, add, and change; not delete).
- **May see:** Game schedule, opponent, and score or result context tied to that work.
- **May use:** Simple player labels (name, position, jersey) only to tag notes.
- **Must not see:** Medical records, sports-science measures, medical flags on shared views, or free-text player-card notes that are not the scouting-note body.

### Video analyst

- **May see (look only):** Scouting note text about player tendencies and opponent strengths or weaknesses for games they are breaking down. They do not get write access to those notes.
- **May see:** Game schedule, opponent, period and score context, and game-event facts used to find and label video.
- **May use:** Simple player labels only to tag clips and reviews.
- **Must not see:** Medical records, sports-science measures, medical flags on shared views, or free-text player-card notes beyond those labels.

The two jobs are not the same. The assistant scout may write scouting notes. The video analyst may only read them.

---

## Why these limits exist

- **Job need:** Both roles need scouting and game information to do mid-season work.
- **Seal:** Medical and sports-science data stay sealed. A short medical flag (for example injured or not cleared) on a shared scouting or game screen is still a leak, even if the full medical table is hidden.
- **Master key:** Staff sign-in requests must never use the service-role master key. That key can skip the normal row filters and see sealed care data. The written master-key rule allows **no** server-only jobs to use it. The real key stays in server settings and must not be pasted into documents or chat.

---

## What the break-tests proved

From the recorded break-test results (not a vague “tests passed” claim):

| Check | Result |
| --- | --- |
| Assistant scout medical deny | Pass — blocked |
| Assistant scout sports-science deny | Pass — blocked |
| Assistant scout medical flags on shared view | Pass — no flag leak |
| Assistant scout scouting allow | Pass — allowed |
| Assistant scout game-data allow | Pass — allowed |
| Video analyst medical deny | Pass — blocked |
| Video analyst sports-science deny | Pass — blocked |
| Video analyst medical flags on shared view | Pass — no flag leak |
| Video analyst scouting allow | Pass — allowed |
| Video analyst game-data allow | Pass — allowed |
| Medical control still reads care data | Pass — allowed |

After those checks: no forbidden medical, sports-science, or shared-view flag access succeeded. No further change was required in that pass.

---

## Residual risk

1. **Older “make the page work” patterns:** Earlier work noticed a staff directory screen that used the master key. The current master-key rule does **not** authorize that pattern. Later work must not copy it into assistant scout or video analyst screens.
2. **Shared player screens outside the sealed view:** The access matrix still calls out injured-reserve style labels on shared player screens as a medical-flag risk. Later product work must keep those flags off screens the new jobs can open.

**Hard rule for later sprints:** Do not reopen medical or sports-science access for the assistant scout or the video analyst without a new written decision. Do not invent a new role or a wider permission in a later change without updating this approval trail.

Facts not in the four source files: not recorded.

---

## Sources (every claim traces here)

1. `docs/access/new-roles-brief.md`
2. `docs/access/access-matrix-v2.md`
3. `docs/access/service-role-key-rule.md`
4. `docs/access/role-action-results.md`

---

## Approval

- [ ] Hockey operations lead agrees the two jobs may see only scouting and game information as described above
- [ ] Hockey operations lead agrees medical data, sports-science data, and medical flags on shared views stay sealed
- [ ] Hockey operations lead agrees staff requests must not use the master key

**Approver name:** _______________________  
**Date:** _______________________