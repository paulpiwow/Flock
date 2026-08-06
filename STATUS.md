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
- [ ] **Phase 5 — Trends / Group Maker / CGL Picker / Hub:** admin charts, snake draft, spin-the-wheel, CGL checklist.
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

### 7/16/2026
- README.md, STATUS.md
