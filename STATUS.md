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
- [~] **Phase 6 — Notifications + PWA polish:**
  - [x] **PWA install:** PNG icons (192/512 maskable + apple-touch 180), service worker (`public/sw.js`:
    network-first navigations, SWR assets, offline fallback), `/offline` page, prod-only SW registration,
    `InstallPrompt` (Android button + iOS Add-to-Home hint, dismissible). Verified via prod build:
    SW active, manifest valid, offline precached, 0 errors. _(8/6)_
  - [~] Web push notifications — **event-driven done** (prayer request → recipient; new memory verse
    → audience) via VAPID/`web-push`. Scheduled ones (attendance reminder, RS roundup) intentionally
    skipped for v1. Needs `VAPID_*` env vars in Vercel + testing on real phones.
  - [x] **Deployed to Vercel** (8/6): `flock-six-self.vercel.app`. Prod build green after adding
    `postinstall: prisma generate`. First 500 was env vars pasted WITH quotes — fixed (values must be
    unquoted in Vercel), redeployed clean.

## Open questions (to settle with Paul/Will/Ty)
- Hall binding: **join code** vs. RS-approves-against-roster (or both)? Leaning join code for v1.
- First-RS bootstrap: seed the 3 RS accounts by hand (agreed) — mechanism TBD (SQL seed script).
- Excused vs. unexcused absences.
- Care-note privacy/retention; can a student ever see their own notes.
- Group Maker: live multi-device draft vs. one shared RS screen for v1.
- Merge 1-on-1 / LEAD / Connect Class into one "CGL Hub"?
- Exact taskbar icon set per role.
- Memory-verse translation: WEB or KJV (both public domain) — pick default.

## Go-live checklist

Switching from testing → real is Supabase settings + data cleanup — **no code change / redeploy needed**
(the app already handles confirm-email on OR off). Dev and prod share one Supabase DB.

**Phase A — Deploy for Will/Ty testing (Confirm email OFF)**
- [ ] Deploy to Vercel: connect the GitHub repo.
- [ ] Set Vercel env vars: `DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_SUPABASE_URL`,
      `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_APP_URL` (= the Vercel domain).
- [ ] Supabase → Auth → URL config: set **Site URL + Redirect URLs** to the Vercel domain
      (else confirmation links later point at localhost).
- [ ] Confirm email = **OFF** (already set).
- [ ] (Optional) PWA install polish (Phase 6) so it adds to home screen nicely.
- [ ] Will & Ty log in on their phones with the fake accounts and explore Hall 2 (OHANA) demo data.

**Phase B — Switch to real (Confirm email ON)**
- [ ] Set up **Resend** custom SMTP in Supabase (Settings → Auth → SMTP).
- [ ] Delete fake test logins: Supabase → Auth → Users (`paul.test`, `newguy`, `student1`, `test2`, `cgl`).
- [ ] Clear Hall 2 demo data: `node scripts/reset-hall.js OHANA --confirm`.
- [ ] Turn **Confirm email ON**.
- [ ] Bootstrap RSs: each signs up with their hall code (Paul LACASA / Will OHANA / Ty OKLY), then
      `node scripts/set-role.js <email> ADMIN` once per hall.
- [ ] Real students sign up with their hall's code. Done.

## Changelog

### 9/1/2026 (Forgot password)
- **Self-serve password reset.** Login screen has a **Forgot password?** link → enter email → Supabase
  emails a reset link → link lands on `/auth/confirm` (verifies the token, establishes a session) →
  `/reset-password` (new password + confirm) → `/home`. Response to the email form is always the same
  message so it can't be used to check whether an address has an account.
- `/auth/confirm` accepts both link shapes Supabase can send (`?token_hash=…&type=recovery` and
  `?code=…`), so it works with the default email template *and* the recommended SSR one. Bad/expired
  links bounce to `/?error=link` with a friendly message.
- **Config needed (Supabase → Auth):** (1) **URL Configuration → Redirect URLs** must include
  `https://getflock.cc/auth/confirm` (and `http://localhost:3000/auth/confirm` for dev) — otherwise
  Supabase ignores our `redirectTo` and sends people to the Site URL, where nothing handles the link.
  (2) *Recommended:* **Email Templates → Reset password** — change the link to
  `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/reset-password`.
  The default `{{ .ConfirmationURL }}` uses PKCE, which only works if the link is opened in the same
  browser that requested it (fails when you request on a laptop and tap the link on your phone).
- **RS reset link (no email).** Because Supabase mail lands in Liberty junk, the People page now has a
  **Reset** button on every person (RS only). It mints a one-time recovery token via the service-role
  admin client (`createRecoveryToken`) and shows a sheet with **Share** (phone share sheet → Messages)
  and **Copy link**. The RS texts it; the student opens it → `/auth/confirm` → `/reset-password`. Works
  once, expires ~1 hour. Needs `SUPABASE_SERVICE_ROLE_KEY` (same as Deny) — without it the button shows
  a clear "not set up" error. Also works regardless of the email-template setting above.
- **Confirm password box on sign up** (server-validated match; "Passwords don't match.").
- Why: a student signed up with a mistyped password and had no way back in.

### 8/9/2026 (RS approval gate — replaces email confirmation)
- New authorization model: **email confirmation off + RS approves each signup.** A student signs up
  with `@liberty.edu` + hall code → lands **pending** (no access) → their RS approves or denies on the
  People page. A human who knows the roster is a better gate than email verification for a dorm, and it
  sidesteps the Microsoft-junk deliverability problem entirely.
- Schema: `User.approvedAt DateTime?` (null = pending; RSs/ADMIN exempt). Pushed; existing users
  grandfathered to approved.
- Guard: `requireActiveUser` redirects hall-bound-but-unapproved non-admins to a new **/pending** screen.
- People page: **Pending approval** section at top (shows username + email) with **Approve** / **Deny**.
  Deny fully deletes the account — app row always, and the Supabase **auth login too** via a service-role
  admin client (`src/lib/supabase/admin.ts`, `deleteAuthUser`). `set-role.js` now also stamps `approvedAt`.
- **Config still needed (Paul):** (1) turn **Confirm email OFF** in Supabase; (2) add
  `SUPABASE_SERVICE_ROLE_KEY` to `.env` + Vercel (Settings → API → service_role) so Deny also removes the
  login — without it, Deny removes the app record but the login lingers (they'd reappear as pending).
- Verified: prod build green (/pending + /people compile). Couldn't click-test (no test login post-wipe);
  test with a throwaway signup after deploy.

### 8/8/2026 (copy + notifications UX)
- Login/signup tagline shortened to **"Shepherding The Hall"**.
- `NotificationsToggle` now takes a `variant`: **prompt** (Home — only shows while off, disappears once
  on) and **settings** (always shows on/off). New `/notifications` page (settings variant) + a
  **Notifications** item on the RS/CGL More page. Home keeps the prompt variant.
- NOTE: students have no More page, so they can enable from the Home prompt but can't disable in-app yet.

### 8/8/2026 (web push notifications — event-driven)
- Added Web Push (VAPID / `web-push`). Two triggers, both fire from existing server code (no cron):
  **prayer request** → the recipient tier (student→their CGL, CGL→hall RSs); **new memory verse** →
  the audience (RS→CGLs, CGL→their group's members). Sends are best-effort and never block the action.
- Pieces: `PushSubscription` model (pushed); `src/lib/push.ts` (send helper, prunes dead subs on 404/410);
  `src/lib/actions/push.ts` (save/remove subscription); `NotificationsToggle` on Home (permission +
  subscribe, iOS "add to home screen first" hint, hides where unsupported); `sw.js` `push` +
  `notificationclick` handlers (cache bumped v1→v2).
- **Requires 3 env vars** (local `.env` set; add to Vercel, UNQUOTED): `NEXT_PUBLIC_VAPID_PUBLIC_KEY`,
  `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`. Without them the toggle stays hidden and sends no-op.
- Verified: prod build green; toggle renders on Home and reflects permission state; no console errors.
  Real delivery must be tested on actual phones (SW is prod-only; iOS needs the PWA installed).

### 8/8/2026 (bug fix — Trends/CGL Status didn't refresh after attendance change)
- `confirmAttendanceAction` only revalidated `/group` and `/attendance`, so **Trends** (`/trends`) and
  **CGL Status** (`/hub`) — both derived live from confirmed attendance — kept serving cached numbers
  after a roster change. Added `revalidatePath` for `/trends`, `/hub`, and `/home`. Trends were never
  hardcoded; this was purely a missing cache invalidation.
- Verified: changed paul's Group W1 from 2/7 → 7/7; the W1 bar moved 69% → 77% on the RS Trends page.

### 8/8/2026 (remove in-app "Make RS")
- Removed the **Make RS** button from the People page and its `promoteToRsAction` / `promoteToRs`
  code path. RS accounts are now provisioned the same way for every hall: the new RS signs up with
  their hall's join code (binds as MEMBER), then is promoted once via `node scripts/set-role.js
  <email> ADMIN`. Keeps role-granting deliberate and consistent (the first RS on any hall always
  needed the script anyway). CGL rows now show only Demote; student rows only Make CGL.
- Tradeoff noted: appointing a co-RS now requires the script (prod DB access) instead of a button —
  fine for ~1 RS per hall.
- Join codes unchanged: still set via the seed / Supabase table editor (not RS-generated).

### 8/8/2026 (verse lookup — auto-fetch verse text)
- Memory verse add flow no longer requires hand-typing the text. The RS/CGL types a **reference**
  (e.g. "Philippians 4:6-7"), hits **Look up**, and the text is fetched and shown to confirm (still
  editable) before saving. Two-step UI in `VerseManager` (lookup → confirm/add; "Search again" resets).
- **Translation: WEB (World English Bible) via bible-api.com** — public domain, **no API key**, no
  attribution/licensing burden. Matches the existing copyright decision (public-domain translation).
  New `src/lib/bible.ts` (`lookupVerse`, server-only fetch, `no-store`) + `lookupVerse` server action
  in `actions/verses.ts` (auth-gated, no DB writes). Verse text is collapsed to a clean paragraph.
- Graceful errors: bad reference → "Couldn’t find that reference…"; network failure → retry message.
- Verified in browser (RS): lookup fills the text, add saves it to the list, bad refs show the error.
  No console errors. NB: bible-api.com rate-limits ~15 req / 30s per IP — fine for this use.

### 8/8/2026 (post-testing tweaks — batch 7, student tiles + notes bug)
1. Student Home: swapped **Memory Verse** and **Attendance** tile positions (Prayer Requests, Memory
   Verse, Attendance, Resources).
2. **Bug fix — LEAD notes carried unsaved text across weeks.** The journal `<textarea>` is uncontrolled
   (`defaultValue`), so navigating to another week reused the same DOM node and kept whatever was typed.
   Added `key={week.id}` on `WeeklyNoteEditor` in the notes page so it remounts per week — unsaved text
   is discarded and the selected week's own notes load. Verified in browser.

### 8/8/2026 (post-testing tweaks — batch 6, students + resource scoping)
1. RS Home: swapped **Verses** and **Attendance** tile positions (Verses now next to LEAD, Attendance
   last).
2. RS More: removed the **Attendance** tile (still on RS Home + reachable at /attendance).
3. **Students lose the Campcom notes section entirely:** removed from their navbar + Home; `/notes`
   now redirects MEMBER → /home. LEAD notes stay for CGLs & RSs (empty-state heading fixed to "LEAD").
4. Student Home + navbar now have **Resources** and **Attendance** boxes; navbar order is Home ·
   Prayer · Verse · Attendance · Resources (Attendance next to Resources). Attendance → `/attendance`,
   which already renders the student self-check-in card.
5. **Resource visibility scoping.** New `ResourceAudience { ADMIN, LEADERS, ALL }` on `Resource`
   (default ALL, pushed). The RS's add form now has **Only me / Me + CGLs / Everyone** buttons; the
   data layer filters reads by role (RS sees all; CGL sees LEADERS+ALL; student sees ALL only). RS list
   shows a scope badge per link. `getResources` is the single gate — enforced server-side.
- Build + typecheck green. Verified RS (tile order, no More Attendance, add w/ scope + badges), student
  (nav/tiles, /notes redirect, sees only ALL resource, attendance check-in card). No console errors.
  Prisma client regen again needed the dev server stopped first (Windows DLL lock).

### 8/8/2026 (post-testing tweaks — batch 5, home/more layout)
1. RS More page: **CGL Status** and **CGL Picker** now sit above People (order: Attendance, CGL
   Status, CGL Picker, People, Group Maker, Resources).
2. Removed the **"File an IR in Beacon"** box from the RS Spiritual Summaries page (+ unused
   `BEACON_URL` / `ExternalLink` imports).
3. RS Home tile order → **Prayer Requests** (first), Spiritual Summaries, LEAD, **Attendance**, Trends,
   Verses — so in the 2-col grid Attendance sits next to LEAD and Trends/Verses are the last row.
4. CGL Home: replaced the **Attendance** tile with **Prayer Requests** (Attendance still at the top of
   the CGL More page).
- Pure UI (features.ts + care/page.tsx); no schema change. Verified RS + CGL in browser, no console errors.

### 8/8/2026 (post-testing tweaks — batch 4)
1. **Removed the tag dropdown** from Spiritual Summaries: gone from the form (`CareNoteForm`), the
   action + zod schema (`actions/care.ts`), the data layer (`addCareNote` in `care.ts`), and the
   timeline badge (`CareTimeline`). The `CareNoteTag` enum + `tag` column stay in the schema (unused,
   avoids a migration).
2. **Removed 1-on-1s entirely** (Spiritual Summaries cover it): deleted `/one-on-ones`, `OneOnOneRoster`,
   `lib/oneonone.ts`, `lib/actions/oneonone.ts`, the `OneOnOne` model (pushed), and the More tile.
3. **Prayer Requests** — a one-way channel up the chain (Student → CGL → RS; RS receives only):
   - Schema: `PrayerRequest` model + `PrayerAudience { CGL, RS }` (audience-based visibility, no
     recipientId — handles multiple RSs cleanly). Pushed via `prisma db push`.
   - `lib/prayer.ts` (`getPrayerData`, `submitPrayerRequest`), `lib/actions/prayer.ts`,
     `PrayerRequestForm`, role-aware `/prayer` page. All hall-scoped; a CGL only sees their own guys'
     requests (author's `groupId` ∈ their led groups).
4. **Nav restructure:** `Prayer` (HandHeart icon) added to all three navbars + a Prayer Requests Home
   tile for students. **Attendance moved off** the RS & CGL navbars **to the top of their More pages**
   (RS → /attendance, CGL → /group). Student navbar: Home · Prayer · Campcom · Verse · Resources.
- Build + typecheck green. Verified full round-trip in browser (student sends → CGL receives + sends up
  → RS receives), all navbars, More pages, no console errors. NOTE: found demo `student1` had no group
  (`groupId: null`) so requests had nowhere to go — assigned to Group 1 to test; real halls assign via
  the draft board. Regenerating the Prisma client required stopping the dev server (it locks the query
  engine DLL on Windows → EPERM on `prisma generate`).

### 8/6/2026 (post-testing tweaks — batch 3)
1. Removed "Hey" from the Home greeting (just the name now).
2. Sign out back on Home for all roles; removed the Sign-out item from More (reverts batch-2 #8).
3. Groups now display as the CGL's last name ("Cobb's Group") via `groupLabel()` in names.ts, applied
   everywhere (draft, attendance tabs, /group, care, people, hub, trends). Derived from the current
   leader (no stale names). NOTE: demo CGLs share surnames so labels repeat; real halls will be unique.
4. Campcom Notes → **LEAD** for CGL & RS (nav + tiles); students still see **Campcom Notes**.
5. Added **Summaries** to the CGL bottom navbar; removed the **Resources** tile from Home (all roles —
   still reachable via nav/More).
6. Removed **Beacon** from the RS More page.
- Build + typecheck green; verified CGL + RS in browser. No console errors.

### 8/6/2026 (post-testing tweaks — batch 2)
1. Notes box (`NotesTextarea`) now supports Tab/Shift+Tab indent + Enter-continues-bullets; used in Campcom Notes editor.
2. `BackButton` in the app layout (top-left, all pages except Home) — uses history.back().
3. CGL Picker already auto-includes new CGLs (wheel = LEADER role; "Make CGL" sets it). Confirmed.
4. 1-on-1s now biweekly (nudge if not met in 14 days); copy "Meet each guy every 2 weeks."
5. Removed "Quick links" from Home (+ retired the resource pin toggle, now pointless).
6. Removed Hub from CGL nav (taskbar + Home + More). `/hub` is now RS-only ("CGL Status").
7. Renamed CGL "My Group" → **Attendance** (nav/tile). **Auto-weekly attendance:** `getCurrentWeek`
   now auto-creates the current calendar week (anchored to Wednesday, ET) with a "Passage TBD"
   placeholder, so a new week starts with no one checked. NOTE: Hall 2 demo has weeks pre-seeded
   through Sep 23, so the reset only shows once those pass; real halls roll fresh each Wednesday.
8. More page is now a **list** (not boxes), with **Sign out** as a list item. Home keeps Sign out only
   for students (they have no More tab).
9. Renamed "Care Notes" → **Spiritual Summaries** (nav "Summaries", tiles/pages/headings).
10. Renamed "Notes" → **Campcom Notes** (nav "Campcom", tiles/heading).
- Build + typecheck green; verified in browser (taskbars, tiles, More list, bullets, back button,
  biweekly copy, picker, renames). Left unused exports (getCglHub, getPinnedResources, pin actions)
  and the possibleIR column — harmless, can prune later.

### 8/6/2026 (post-testing tweaks — batch 1)
- Removed "Liberty University · Resident Life" line from the landing page.
- Removed the **"Flag as possible IR"** feature from the UI: checkbox on the care-note form, the
  Possible-IR badges/red border on the timeline + RS feed, and the possible-IR-first sort in the RS
  feed. Left the `possibleIR` column + `POSSIBLE_IR` enum in the schema (unused) to avoid a migration.
  Beacon IR link (RS) is unchanged. Verified: landing text gone, care form has no checkbox, no errors.

### 8/6/2026 (PWA install experience)
- Generated PNG icons from the sheep mark (`scripts/gen-icons.js` via sharp): icon-192/512 (maskable-safe)
  + apple-touch-icon 180. Manifest already referenced 192/512.
- `public/sw.js` service worker (network-first navigations → `/offline` fallback; SWR for static assets;
  never caches app data). `/offline` public page. `ServiceWorkerRegister` (production only).
- `InstallPrompt` banner on Home: Chrome/Android install button (beforeinstallprompt) + iOS Safari
  "Share → Add to Home Screen" hint; hides if already installed; dismissible (localStorage).
- **Bug fixed:** proxy matcher wasn't excluding `/sw.js` → it 307-redirected (would break SW registration).
  Added `sw.js` to the exclusion list. Now serves 200 application/javascript.
- Verified via `npm run build && npm start`: SW registered + active (scope /), manifest valid (standalone,
  192/512 icons), `/offline` precached, all PWA assets 200, fresh-tab console 0 errors.

### 8/6/2026 (Real hall codes + reset tool)
- Set real join codes: **Hall 1 = LACASA (Paul), Hall 2 = OHANA (Will), Hall 3 = OKLY (Ty)**
  (in `prisma/seed.ts` + applied). Codes case-insensitive at signup, stored uppercase, rotatable.
  Demo data (71 users) lives on Hall 2 / OHANA; Halls 1 & 3 are empty for real signups.
- **`scripts/reset-hall.js <name|joinCode> [--confirm]`** — wipes one hall's data (users, groups,
  attendance, care notes, verses, 1-on-1s, weeks, notes, resources) but KEEPS the hall + code. Dry-run
  by default; `--confirm` to delete. Verified via dry-run on OHANA (sees all demo data, deletes nothing).
  Use after deploy+demo: `node scripts/reset-hall.js OHANA --confirm`. NB: doesn't delete Supabase Auth
  accounts — remove real test logins in Supabase → Authentication → Users too.
  Also NB: dev and prod share one Supabase DB, so running this locally clears the deployed data.

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
