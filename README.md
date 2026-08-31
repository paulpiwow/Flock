# 🐑 Flock

**A role-based progressive web app for shepherding a college residence hall** — attendance, spiritual care, weekly Scripture, prayer requests, and community-group management, all in one installable mobile app.

Flock replaces the paper rosters, spreadsheets, and group texts that Resident Shepherds and Community Group Leaders use to care for ~70 men per hall. Everything is scoped per hall, role-aware, and built to run on a phone.

---

## 🔗 Live Demo

> **Live app:** <!-- Paste your live URL here, e.g. --> https://getflock.cc

> **Demo walkthrough:** <!-- Paste a demo video link (Loom/YouTube) here — recommended, since sign-up is invite-gated -->

> **Screenshots:** <!-- Add screenshots or a GIF here -->

*The app is intentionally gated (Liberty email + a hall join code + leader approval), so a short video or screenshots are the best way for reviewers to see it in action.*

---

## What it does

Three roles, one login, three different experiences:

| Role | Sees / does |
| --- | --- |
| **Resident Shepherd (RS)** | Hall-wide oversight: attendance trends, spiritual summaries, leader status, group assignment, member approval |
| **Community Group Leader (CGL)** | Their ~7 guys: confirm attendance, log spiritual summaries, assign memory verses, receive prayer requests |
| **Student** | Weekly Scripture, memory verses, self check-in, and sending prayer requests up the chain |

**Core features**

- 📋 **Attendance** — student self-check-in + leader confirmation, auto-generated weekly cycles, and an RS analytics dashboard (per-week and per-group trends)
- 🙏 **Prayer requests** — routed up the shepherding chain (student → CGL → RS)
- 📖 **Weekly Scripture & memory verses** — two-tier assignment with one-tap verse lookup via a Bible API
- 📝 **Spiritual summaries** — structured, per-student care notes visible to the leader and RS
- 👥 **Community group management** — a draft board for assigning students to groups
- 🔔 **Push notifications** — real-time alerts for prayer requests and new verses on installed devices
- ✅ **Leader-approved onboarding** — RS approves each new signup, so only real hall members get in

---

## Tech stack

- **Framework:** Next.js 16 (App Router) · React 19 · TypeScript
- **Styling:** Tailwind CSS v4
- **Database & ORM:** PostgreSQL (Supabase) · Prisma 6
- **Auth:** Supabase Auth (email/password, domain-gated)
- **Notifications:** Web Push API + VAPID + service workers
- **PWA:** installable, offline-capable (service worker + web manifest)
- **Hosting:** Vercel (custom domain)

---

## Engineering highlights

- **Multi-tenant, role-based access control.** Three roles across independent halls, enforced by a server-side data layer that injects the current user's hall into *every* query — strict tenant isolation with no cross-hall data leakage.
- **Defense-in-depth security.** Postgres Row-Level Security on every table locks down the public API surface; the privileged app connection is the only path to data.
- **Auto-weekly cadence.** Attendance weeks are generated automatically (Wednesday-anchored) so the rhythm continues with no manual upkeep.
- **Installable PWA with push.** A service worker delivers offline fallback and native-style Web Push notifications on mobile.
- **Human-in-the-loop onboarding.** After hitting real-world email-deliverability limits with an enterprise mail provider, onboarding was redesigned around leader approval — a stronger, dependency-free gate.

---

## Architecture at a glance

```
Next.js (App Router, server components + server actions)
        │
        ├─ Supabase Auth  ──────────────►  session / identity
        │
        └─ Prisma  ─────────────────────►  PostgreSQL (Supabase)
                                            • hall-scoped queries
                                            • Row-Level Security
Service Worker  ──►  Web Push (VAPID)  ──►  installed mobile devices
```

Every domain table carries a `hallId`; a single access layer guarantees a user only ever reads and writes within their own hall.

---

## Status

Built and deployed to production, serving multiple residence halls. Actively used and iterated on with real leaders and students.
