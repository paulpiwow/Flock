# Flock — Status

A PWA for shepherding a hall: attendance, care notes, weekly Scripture, and the tools RS/CGLs actually use. Liberty University · Resident Life. ~70 men per hall, role-based **RS → CGL → Student**, multi-hall via `hallId`.

## Locked decisions (v1)
- **Roles:** `ADMIN` (RS) · `LEADER` (CGL) · `MEMBER` (Student).
- **Multi-tenant:** everything scopes to `hallId`; no cross-hall visibility.
- **Attendance:** CGL-owned roster tap; RS sees all-hall alphabetized (absentees on top).
- **Auth:** Supabase, login gated to `@liberty.edu`; new users default to `MEMBER`.
- **No-AI line:** Flock never interprets Scripture. Enduring Word linked as an outside human resource only.
- **Workflow:** Claude writes code; Paul/Will/Ty make all commits & pushes.

## Roadmap
- [x] **Phase 0 — Foundation:** Next.js 16 + TS + Tailwind v4, Prisma schema, design tokens, PWA manifest, folder structure. _(verified rendering 8/5)_
- [ ] **Phase 1 — Auth + Shell:** Supabase auth, Liberty-email gate, role-aware taskbar, Login & Home.
- [ ] **Phase 2 — Attendance:** roster tap → all-hall alphabetized view.
- [ ] **Phase 3 — Care Notes & IRs:** notes timeline, RS notify, possible-IR flag, Beacon link.
- [ ] **Phase 4 — Weekly Notes + Resources:** per-week passage, private notes, Enduring Word, RS-editable resources.
- [ ] **Phase 5 — Trends / Group Maker / CGL Picker / Hub:** admin charts, snake draft, spin-the-wheel, CGL checklist.
- [ ] **Phase 6 — Notifications + PWA polish:** web push opt-in, install flow, offline.

## Open questions (to settle with Paul/Will/Ty)
- First-RS-on-a-hall verification.
- Excused vs. unexcused absences.
- Care-note privacy/retention; can a student ever see their own notes.
- Group Maker: live multi-device draft vs. one shared RS screen for v1.
- Merge 1-on-1 / LEAD / Connect Class into one "CGL Hub"?
- Exact taskbar icon set per role.

## Changelog

### 8/5/2026
- Read design doc; locked v1 decisions above.
- **Phase 0 complete:** scaffolded Next.js 16 (App Router, TS, Tailwind v4), full Prisma
  schema (Hall/User/Group/Week/MemoryVerse/WeeklyNote/AttendanceRecord/CareNote/Resource),
  green design tokens, sheep mark, PWA manifest, role/taskbar config, themed landing + login.
- Verified in browser: palette compiles, no errors.

### 7/16/2026
- README.md, STATUS.md
