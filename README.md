# Ipswich PIWC — Church Management Platform

Internal church management for **The Church of Pentecost – Ipswich PIWC (UK)**.
For internal use by leadership, ministry leaders, admins and authorised
volunteers. This is **not** the official church financial/accounting system.

> **Status:** Phases 1–4 complete. The foundation (app shell, nav, dashboard on
> mock data) plus the **People**, **Ministries** and **Attendance** modules are
> built on Cloud Firestore. Remaining modules are scaffolded with placeholder
> routes and built one phase at a time — see [Roadmap](#roadmap).

## Core principle

**A person is the central entity.** Members, women, men, children and visitors
are all documents in one `people` collection. Ministries, attendance,
contributions, relationships and follow-up all reference a person — never
duplicated.

## Tech stack

| Concern       | Choice                                        |
| ------------- | --------------------------------------------- |
| Framework     | TanStack Start (SSR) + TanStack Router        |
| Data fetching | TanStack Query                                |
| Language      | TypeScript (strict)                           |
| Styling       | Tailwind CSS v4 + shadcn/ui (Base UI variant) |
| Icons         | Hugeicons                                     |
| Database      | Cloud Firestore (system of record)            |
| Auth / files  | Firebase (Auth, Storage, FCM)                 |
| Validation    | Zod (at boundaries)                           |
| Testing       | Vitest + Testing Library                      |
| Tooling       | ESLint, Prettier, Vite 8                      |

**Cloud Firestore** is the system of record for all church data, accessed from
the client with the Firebase Web SDK. Firebase also provides authentication,
file storage (profile photos) and Cloud Messaging.

## Getting started

```bash
# 1. Install
pnpm install

# 2. Configure environment
cp .env.example .env        # then fill in your Firebase web config

# 3. Run the app
pnpm dev                    # http://localhost:3000
```

The app uses a **mock authenticated session** (a `CHURCH_ADMIN`), so you can
browse the whole shell without signing in. Data modules (People, …) need
Firebase configured to read/write — until then they show a "connect Firebase"
state instead of crashing.

### Seeing People data locally

Either point `.env` at a real Firebase project (fill the `VITE_FIREBASE_*`
values), **or** use the local Firebase emulators:

```bash
npm i -g firebase-tools      # once
firebase emulators:start     # starts Firestore + Auth emulators

# in .env:  VITE_FIREBASE_USE_EMULATOR=true  (+ any VITE_FIREBASE_PROJECT_ID)
pnpm dev
```

> ⚠️ `firestore.rules` currently allows all access for development while auth is
> mocked — it must be tightened before storing real data (see the file's notes).

## Scripts

| Command          | Description                        |
| ---------------- | ---------------------------------- |
| `pnpm dev`       | Dev server (HMR, SSR) on port 3000 |
| `pnpm build`     | Production build → `dist/`         |
| `pnpm start`     | Serve the production build (Node)  |
| `pnpm typecheck` | `tsc --noEmit`                     |
| `pnpm lint`      | ESLint                             |
| `pnpm format`    | Prettier write                     |
| `pnpm test`      | Vitest (run once)                  |

## Environment variables

See [`.env.example`](./.env.example). Summary:

- `VITE_FIREBASE_*` — Firebase Web config (public; enables Firestore/auth/storage
  in the browser). Needed for data modules to read/write.
- `VITE_FIREBASE_USE_EMULATOR` — `true` to use the local Firebase emulators.
- `FIREBASE_SERVICE_ACCOUNT` / `GOOGLE_APPLICATION_CREDENTIALS` — Firebase Admin
  (server-only; for verifying auth tokens when real auth is wired).

## Project structure

```
src/
  routes/                 # File-based routes (TanStack Router)
    __root.tsx            # HTML document + providers
    index.tsx             # → redirects to /dashboard
    login.tsx             # Auth placeholder
    _app.tsx              # Auth-guarded layout (sidebar/topbar)
    _app/                 # Authenticated module routes
      dashboard.tsx       # Built (mock data)
      people/             # Built — list + profile (Firestore)
      …                   # Placeholder module routes
  domain/                 # Pure domain types + Zod schemas (Person, enums)
  features/               # Feature modules (UI + query hooks per domain)
    dashboard/
    people/               # PersonForm, dialog, table pieces, query hooks
  components/
    ui/                   # shadcn/ui (Base UI) primitives + app states
    layout/               # AppShell, Sidebar, Topbar, NotFound
  lib/
    auth/                 # permissions matrix, session, route guards
    firebase/             # client (Web SDK) + admin SDK
    firestore/            # Firestore data access (e.g. people.ts)
    icons.ts              # central Hugeicons registry
    env.server.ts         # server env (Zod validated)
    env.public.ts         # public env (Zod validated)
    navigation.ts         # central nav config (permission-aware)
    utils.ts
  router.tsx              # Router factory + QueryClient
```

## Architecture notes

- **People-centric:** one Firestore `people` collection; visitors/members/
  children differ only by `membershipStatus`.
- **Firestore is the system of record**, accessed client-side via the Web SDK.
  All reads/writes live in `src/lib/firestore/*`; components use TanStack Query
  hooks in `src/features/*/queries.ts` — never Firestore calls in components.
- **Domain types** (`src/domain`) are ORM-free TS + Zod, shared by data access
  and UI. Validation happens at the form/data boundary.
- **Central permissions:** `src/lib/auth/permissions.ts` is the single
  authorization source; routes guard via `requirePermission` in `beforeLoad`;
  the sidebar filters items by permission; sensitive fields (contact, notes)
  are gated by `people:read_sensitive`.
- **Contributions ≠ accounting:** internal ministry tracking only.

## Roadmap

1. **Foundation** ✅ — tooling, app shell, nav, dashboard (mock), UI kit.
2. **People** ✅ — list, search, filters, add/edit, profile, status (Firestore).
3. **Ministries** ✅ — data-driven departments, add/edit, assign/remove
   members, leader/assistant roles; person↔many ministries on the profile.
4. **Attendance** ✅ — services, present/absent recording with search, summary
   stats (avg/latest), history; attendance rate on the member profile.
5. Contributions — cycles, records, totals, expenses.
6. Reminders — birthdays, anniversaries, needs-attention.
7. Analytics — membership/attendance/ministry stats, conversion.
8. Member experience — portal, prayer requests, testimonies.
