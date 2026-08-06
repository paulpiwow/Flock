# Flock — Status

A PWA for shepherding a hall: attendance, care notes, weekly Scripture, and the tools RS/CGLs actually use. Liberty University · Resident Life. ~70 men per hall, role-based **RS → CGL → Student**, multi-hall via `hallId`.

## Locked decisions (v1)
- **Roles:** `ADMIN` (RS) · `LEADER` (CGL) · `MEMBER` (Student).
- **Multi-tenant:** everything scopes to `hallId`; no cross-hall visibility.
- **Attendance:** CGL-owned roster tap; RS sees all-hall alphabetized (absentees on top).
- **Auth:** Supabase, login gated to `@liberty.edu`; new users default to `MEMBER`.
- **No-AI line:** Flock never interprets Scripture. Enduring Word linked as an outside human resource only.
- **Workflow:** Claude writes code; Paul/Will/Ty make all commits & pushes.

## Architecture decisions (8/6 — Q&A worked through while building)
1. **No cross-hall access — enforce structurally, not by monitoring.**
   - `@liberty.edu` only proves "Liberty student," not *which hall*. Add a **hall-binding step at
     signup**: a per-hall **join code** (or RS approves against the roster) that stamps `hallId`.
   - Users who sign up before binding sit in a **pending/unassigned** state and see **nothing**.
   - **Enforcement is server-side:** all data access goes through one hall-scoped data layer that
     *always* injects the current user's `hallId` — the client is never trusted. (Note: our Prisma
     connection uses a privileged DB role that **bypasses** Postgres RLS, so RLS is **defense-in-depth**,
     not the primary wall. We still enable RLS on tables in case the anon key is ever used directly.)
   - **`admin` is always hall-scoped:** never check role without also checking `hallId`.
   - Edge cases to handle: student transfer (RS "move user"), pending state, first-RS bootstrap
     (seed the ~3 RS accounts by hand).
2. **Roles = role × resource × scope** (not "RS minus buttons"):
   - RS → hall-wide read/write · CGL → their group's care notes & attendance (group-scoped) + hall-wide
     read of shared content · Student → own private notes (self-scoped) + read-only shared.
   - Carry `role + hallId + groupId` as JWT claims so policies read them without an extra lookup.
   - One source of truth for permissions (policy layer); UI mirrors it. `isActive` flag for role changes.
3. **Capacity is a non-issue.** 3 halls × ~70 ≈ 210; even 10 halls = 700. Managed Postgres handles this
   trivially. Only correctness concern is Wed-night concurrency (~10 CGLs — trivial). Indexes on
   `hallId`, `groupId`, `week` are in the schema.
4. **Copyright — link, don't reproduce.** Enduring Word = **link only**, never embed/scrape its text.
   Scripture: reference + link = free; **printing verse text uses a public-domain translation
   (WEB or KJV)** to avoid licensing. No "official integration" branding.

## Roadmap
- [x] **Phase 0 — Foundation:** Next.js 16 + TS + Tailwind v4, Prisma schema, design tokens, PWA manifest, folder structure. _(verified rendering 8/5)_
- [x] **Phase 1 — Auth + Shell:** Supabase email/password auth + Liberty gate, session middleware +
  route protection, role-aware Home + bottom taskbar, More grid. _(verified Student + RS 8/6)_
- [x] **Phase 1.5 — Hall binding:** per-hall join codes, pending state (`hallId` nullable) → `/join`,
  `requireActiveUser` gate, `isActive` flag. Verified end-to-end: signup-no-code → pending → wrong
  code rejected → valid code binds → Home shows correct hall. _(8/6)_
- [ ] **Phase 1.6 — Hall security hardening (TODO):** central hall-scoped query helper for all domain
  reads/writes; enable Postgres RLS as defense-in-depth; RS "move user" / promote actions in-app;
  seed the 3 real RS accounts; rotate-join-code action.
- [x] **Phase 2 — Attendance (hybrid):** student self-check-in → CGL roster pre-fills → CGL confirms
  (official record) → RS all-hall + per-group, absentees on top, alphabetized by last name. Built on a
  central hall-scoped data layer (`src/lib/attendance.ts`). _(verified all 3 roles 8/6)_
- [x] **Phase 3 — Care Notes & IRs:** CGL logs dated notes per guy (tag + possible-IR flag) → RS
  activity feed (possible-IR highlighted) + admin-only Beacon link + browse all students. Access
  enforced in the data layer: CGL=own group, RS=hall, student=blocked (404). _(verified all roles 8/6)_
- [x] **Phase 4 — Weekly Notes + Resources:** per-week passage + Enduring Word link + private per-person
  journal (never interpreted) + week archive; memory verse (public-domain WEB); RS-editable resources
  with pin-to-Home. RS sets passage/verse/resources. _(verified all roles 8/6)_
- [x] **Phase 5 — Trends / Group Maker / CGL Picker / Hub:**
  - [x] **Community Group Maker** (`/draft`, RS): unassigned pool + per-CGL panels; tap to assign/move/remove;
    doubles as who's-in-each-group. (v1 = RS-run assignment, not live draft.) _(verified 8/6)_
  - [x] **CGL Picker** (`/picker`, RS+CGL): spin-the-wheel auto-filled from the hall's real CGLs. _(verified 8/6)_
  - [x] **Attendance Trends** (`/trends`, RS): SVG chart of overall % over weeks + per-group latest-week bars
    + rule-based "needs attention" (no PRESENT in last 3 weeks). No AI. _(verified 8/6)_
  - [x] **CGL Hub** (`/hub`): CGL checklist (attendance submitted? which guys need a care note?) +
    RS cross-CGL "who's on track" overview. _(verified 8/6)_ 1-on-1/LEAD/Connect Class tracking deferred.
- [ ] **Phase 6 — Notifications + PWA polish:** web push opt-in, install flow, offline.

## Open questions (to settle with Paul/Will/Ty)
- Hall binding: **join code** vs. RS-approves-against-roster (or both)? Leaning join code for v1.
- First-RS bootstrap: seed the 3 RS accounts by hand (agreed) — mechanism TBD (SQL seed script).
- Excused vs. unexcused absences.
- Care-note privacy/retention; can a student ever see their own notes.
- Group Maker: live multi-device draft vs. one shared RS screen for v1.
- Merge 1-on-1 / LEAD / Connect Class into one "CGL Hub"?
- Exact taskbar icon set per role.
- Memory-verse translation: WEB or KJV (both public domain) — pick default.

## Changelog

### 8/6/2026 (RS bootstrap: Make RS + set-role script)
- **First-RS bootstrap:** `scripts/set-role.js <email> <ADMIN|LEADER|MEMBER>` — flips a user's role
  (clears groupId for ADMIN/LEADER). For seeding the 3 hall RSs by hand before there's an in-app RS.
- **Co-RS in-app:** added **"Make RS"** to the People screen — an RS can appoint another person on
  *their own hall* as ADMIN. People page now has a **Resident Shepherds** section; your own row shows
  "You" with no demote (self-guard in UI + data layer, so a hall can't lock out its last RS). Demote
  now handles LEADER and ADMIN; a freed leader's group is deleted if empty, else left leaderless.
- Verified: script (usage/not-found/happy paths); Make RS on a CGL → 2 RSs, ex-CGL left group leaderless;
  demote co-RS → back to 1 RS; self has no demote button. 0 server errors.
- **RS onboarding recap** (how Will/Ty become RSs of their halls): each hall has a join code → they sign
  up with their hall's code (become MEMBER) → run `set-role.js their@email ADMIN` once (first RS per hall);
  additional co-RS via the in-app button. Everything is hallId-scoped, so each RS only sees their hall.

### 8/6/2026 (In-app role management — promote/demote)
- RS can now **promote a student to CGL** (and demote back) in-app — no more manual DB edits.
  `src/lib/people.ts` (RS-only) + `/people` page, linked from RS More as **"People."**
- Promote → role LEADER, clears groupId, creates a new group `"{First}'s Group"` led by them (draft
  members in via Group Maker). Demote → role MEMBER; their group is freed (leaderId null) or deleted if empty.
- Verified end-to-end: promoted student1 → became "Community Group Leader" with full CGL UI + a new
  group ("Sam's Group"); logged in as them to confirm privileges; demoted back → MEMBER, empty group
  auto-deleted, group count restored. 0 server errors.
- This delivers part of the parked **1.6 hardening** (RS move/promote). Still open there: RLS as
  defense-in-depth; assigning a CGL to an existing *leaderless* group (from a demote that kept members).

### 8/6/2026 (Verse nav fix)
- **Bug:** after the two-tier verse rework, only students had a link to `/verse` — RS and CGL had none
  (not in Home/taskbar/More), so they couldn't reach verse management. Added a **Verses** tile to the RS
  and CGL Home grids (swapped out CGL Picker, which stays in each role's More). Verified RS reaches it.

### 8/6/2026 (1-on-1 tracker; retire LEAD placeholder)
- The `1-on-1s` and `LEAD Group` tiles were placeholders both pointing at `/hub`. Built **1-on-1s** for
  real and **removed the LEAD tile**.
- `OneOnOne` model (metAt, hallId, studentId, leaderId). `src/lib/oneonone.ts`: CGL's roster with
  last-met + nudge (>21 days / never); `logOneOnOne` — optional note is also saved as a **care note**
  (tag FOLLOW_UP, prefixed "1-on-1:"), so it flows to the care timeline + RS feed.
- `/one-on-ones` (LEADER only): roster sorted nudge-first, inline "log a meeting" form (date + note).
  1-on-1s tile now points here. Hub gained a real **1-on-1s card** ("N to catch up with"); footer now
  only says LEAD/Connect Class coming soon.
- Verified: logged a 1-on-1 with a note → nudge count 7→6, guy moved to "Last met today", note appeared
  in his care timeline as Follow-up, Hub card + care-gap count updated. LEAD tile gone. Current build 0 errors.
- Deferred: LEAD Group + Connect Class tracking (need their own model/spec).

### 8/6/2026 (Two-tier memory verses)
- Reworked memory verses from one hall-wide "verse of the week" into **two tiers** (`src/lib/verses.ts`):
  `MemoryVerse.audience` = **LEADERS** (RS → the hall's CGLs) or **GROUP** (a CGL → their group's members).
  Decoupled from `Week`; added `hallId`/`groupId`/`authorId`. Each tier is a list (add/delete).
- `/verse` is now role-aware: **student** sees their group's verses (read-only); **CGL** sees the RS's
  leader verses (to memorize) + manages their own group's verses; **RS** manages the leader verses.
  Permissions enforced in the data layer (`requireGroupManage`; a CGL can't touch another group's verses).
- Removed the old week-tied verse (`setMemoryVerse`/`setVerseAction`/`RsVerseForm`).
- Verified all three roles end-to-end (RS set Joshua 1:9 for CGLs → CGL saw it + set Colossians 3:2 for
  Group 1 → student1 saw only Colossians 3:2). Fresh build clean after `.next` cache clear (0 errors).

### 8/6/2026 (fixes during UI testing)
- Migrated `src/middleware.ts` → `src/proxy.ts` (Next 16 convention) to clear the deprecation warning;
  route protection verified intact.
- **Bug fix:** students had no way to reach self-check-in (not in their 4-item taskbar). Added the
  `SelfCheckInCard` to the **student Home**, up top ("This Wednesday → I'm here"). Verified working.
- **Scheduled check-in window** (`src/lib/checkin.ts`): student check-in only opens **Wednesdays
  10pm–midnight Eastern** (computed in ET so it's correct on a UTC server). Outside the window the card
  is hidden on Home (unless already checked in). Unassigned students see "you're not in a group yet"
  instead of a dead button. Dev override: set `CHECKIN_ALWAYS_OPEN=true` in `.env` to test the open
  state off-schedule. Verified: ET window logic (6 mock cases), closed=hidden, open=button, unassigned=message.

### 8/5/2026
- Read design doc; locked v1 decisions above.
- **Phase 0 complete:** scaffolded Next.js 16 (App Router, TS, Tailwind v4), full Prisma
  schema (Hall/User/Group/Week/MemoryVerse/WeeklyNote/AttendanceRecord/CareNote/Resource),
  green design tokens, sheep mark, PWA manifest, role/taskbar config, themed landing + login.
- Verified in browser: palette compiles, no errors.

### 8/6/2026
- **Phase 1 auth built + verified (Student view):** Supabase SSR clients, session middleware +
  route protection, Liberty-gated sign up/in/out actions, user sync, role-aware Home + bottom
  taskbar. Fixed a first-login create race (P2002) with idempotent user creation.
- Recorded the 4 architecture decisions above (hall binding, role×resource×scope, capacity,
  copyright).
- **Phase 1.5 done:** per-hall join codes, pending/`/join` flow, `requireActiveUser` gate, `isActive`.
  Verified: pending gate, wrong-code rejection, code→hall binding, role-switched UI (Student↔RS).
- Seeded 3 halls with codes: **Hall 1 = HALL1-F26, Hall 2 = HALL2-F26, Hall 3 = HALL3-F26**.
- Test accounts (dev): `paul.test@liberty.edu` (Student, Hall 3), `newguy@liberty.edu` (ADMIN, Hall 2);
  password `flockpass123`. **"Confirm email" is OFF in Supabase for dev — turn back ON before launch.**

### 8/6/2026 (Phase 2 — Attendance)
- Locked the **hybrid attendance model**: student self-check-in → CGL confirms (CGL = record of truth).
- Added `selfReportedAt` / `confirmedAt` / `confirmedById` to `AttendanceRecord`.
- Built `src/lib/attendance.ts` — the central hall-scoped data layer (every query injects `hallId`,
  enforces role/group). Seeded **Hall 2** as a demo hall via `scripts/seed-demo.js` (9 groups, 55
  students, 9 CGLs, week 1 = John 15:1-11).
- Reassigned test accounts to Hall 2 for testing: `newguy`=RS, `paul.test`=CGL (Group 1),
  new `student1@liberty.edu`=Student (Group 1). All password `flockpass123`.
- Verified full loop in browser: student "I'm here" → CGL sees "self-checked in" pre-fill → confirm
  (4/7) → RS all-hall shows 4 attended / 51 absent, per-group filter = 4/3. No console errors.
- Note: demo seed names repeat last-name-first (Adams×N, then Baker…) — cosmetic seed artifact only.

### 8/6/2026 (Phase 3 — Care Notes & IRs)
- Built `src/lib/care.ts` with a `requireStudentAccess` gate (CGL→own group, RS→hall, student→never)
  that every read/write passes through; notes carry tag + `possibleIR` + semester.
- Surfaces: CGL guys-list + student timeline + add-note form; RS activity feed (possible-IR sorted
  first) + Beacon link + all-students browse. Unauthorized student access returns 404 (no leak).
- Verified: CGL added a possible-IR note → appears in RS feed highlighted; CGL blocked from Group 2
  student (404); student blocked from own notes (404). No console errors.
- Deferred: real PWA push + read/unread tracking on the RS feed (Phase 6); in-app spiritual-summary
  draft space (open question — export vs. in-app).

### 8/6/2026 (Phase 4 — Weekly Notes + Resources)
- `src/lib/notes.ts` + `src/lib/resources.ts` (hall-scoped). Personal `WeeklyNote` is private per
  author per week; RS-only setters for passage/Enduring URL, memory verse, new week, and resources.
- Screens: `/notes` (passage + Enduring link + private journal + week archive; RS inline edit/new-week),
  `/verse` (memory verse; RS setter), `/resources` (list; RS add/pin/delete), pinned links on Home.
- Verified: RS set verse (John 15:5, WEB) + pinned Enduring Word resource → shows on Home "Quick links";
  student saw passage, wrote a private note (persisted on reload), saw verse + resources with NO edit
  controls; CGL's `/notes` showed his own empty journal (not the student's) — per-author privacy holds.
  No console errors.
- Held to the no-AI line: notes are a blank page + external Enduring Word link; nothing interpreted.
- Deferred (open questions): CGL sharing teaching notes down to guys; note export.

### 8/6/2026 (Phase 5a — Group Maker + CGL Picker)
- **Community Group Maker** scoped down (per Paul) to an **RS-run assignment board**, not a live
  multi-device draft: `src/lib/groups.ts` + `/draft`. Unassigned pool + per-CGL panels; RS picks the
  active CGL then taps guys to draft them in; move/remove supported. Admin-only, hall-scoped.
- **CGL Picker**: `Wheel.tsx` spin-the-wheel auto-filled from the hall's real CGLs (`getHallCGLs`).
- Seeded 5 unassigned students into Hall 2 for the draft pool (dev).
- Verified: assign (Group 1 7→8, pool 5→4), switch active CGL re-targets pool, remove returns to pool;
  wheel spun and landed correctly on the pointer. No console errors.
- Remaining Phase 5: Attendance Trends (RS charts) + CGL Hub (checklist).

### 8/6/2026 (Phase 5b — Trends + CGL Hub → Phase 5 complete)
- **Attendance Trends** (`src/lib/trends.ts` + `/trends`, RS): self-contained SVG line chart of overall
  weekly %, per-group latest-week bars (color-coded low), rule-based "needs attention" (no PRESENT in
  last 3 weeks). Seeded 8 weeks of history for Hall 2 via `scripts/seed-history.js` (78→82→88→74→69→91→84→79%).
- **CGL Hub** (`src/lib/hub.ts` + `/hub`): CGL sees "attendance submitted this week?" + guys still needing
  a care note this semester (links to /care/[id]); RS sees the same across all CGLs ("who's on track").
  Added "CGL Status" tile to RS More.
- Verified: Trends chart + Group 9 dip (0%) + 5 unassigned in needs-attention; RS overview flagged Group 9
  "No attendance"; CGL Hub showed "Done ✓" + 6 guys needing a note. No console errors.
- NOTE: current week is now W8 (Colossians 3:1-17) after history seed; the memory verse set earlier was
  on W1, so /verse shows empty for W8 until an RS sets one. Deferred: 1-on-1/LEAD/Connect Class tracking.

### 7/16/2026
- README.md, STATUS.md
