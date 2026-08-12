# Early Steps English — School Portal

A full childcare-management web app built for **Early Steps English** (English
Activity Center / Centro de Inglés Infantil), covering the day-to-day
workflow of a preschool: check-in/out, daily reports, parent messaging,
photo sharing, billing, staff & classroom management, and enrollment.

> **About this project.** This is an original application built from scratch
> to cover the same kind of workflow as commercial childcare-management
> products (Brightwheel being the best known one). It does not contain or
> reuse Brightwheel's code, design assets, or branding — it's built
> independently for Early Steps English, using the school's own logo and
> colors. It is not affiliated with or endorsed by Brightwheel/Wheelhouse
> Technologies, Inc.

## What's included

- **Check-in / check-out kiosk** — front-desk view to sign children in and
  out, picking from parents or any authorized pickup person.
- **Authorized pickup people** — beyond the parents, families can register
  anyone else allowed to pick up their child (grandparents, an uncle/aunt, a
  nanny/service maid, a school van driver, etc.), each with their own PIN.
  Parents manage this themselves from their portal; staff can too.
- **Daily reports** — meals, naps, potty/diapers, mood, activities, and a
  learning note per child per day, visible to parents in real time.
- **Messaging** — direct staff ↔ family conversations plus classroom/school
  announcements.
- **Photos & videos** — staff upload and tag children/classrooms; parents see
  a private feed of just their own kids.
- **Billing** — tuition plans, invoices, and manually recorded payments
  (cash/card/transfer/check), visible to parents as a statement.
- **Classrooms, staff & enrollment** — admin tools for classrooms, staff
  accounts/roles, and a waitlist → enrollment flow.
- **Two portals** — a staff app (director / teacher / front-desk, with
  role-based access) and a separate parent portal, each with its own login.

## Tech stack

Next.js 16 (App Router, TypeScript, Server Actions), Tailwind CSS v4,
SQLite via Node's built-in `node:sqlite` module (a single local file — no
external database, and no native module to compile — just Node itself),
cookie-based sessions signed with `jose`, passwords hashed with `bcryptjs`.
Everything runs as one self-contained app.

**Requires Node.js 22.5 or newer** (for built-in SQLite support). Check with
`node -v`; a message about SQLite being "experimental" on startup is expected
and harmless — it's Node's own built-in module, not a third-party add-on.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000 — demo data seeds itself automatically the first
time the app starts (see below), so it's ready to explore immediately.

For a production-style run:

```bash
npm run build
npm run start
```

## Demo accounts

The first launch seeds a full demo school so you can click through every
role right away. The login page also has one-click buttons for these:

| Role | Email | Password |
|---|---|---|
| Director (admin) | `admin@earlystepsenglish.com` | `Teach2026!` |
| Teacher | `jennifer@earlystepsenglish.com` | `Teach2026!` |
| Front desk | `frontdesk@earlystepsenglish.com` | `Teach2026!` |
| Parent | `patricia.castillo@example.com` | `Familia2026!` |

All other seeded staff/parent accounts follow the same two passwords above —
see `src/lib/seed.ts` for the full roster of children, families, and staff.

## Where your data lives

Everything — the SQLite database and uploaded photos/videos — is stored
under one folder, controlled by the `STORAGE_DIR` environment variable.
Locally this defaults to `./data` with no configuration needed, so a fresh
clone always starts clean. To reset all data, stop the app and delete that
folder — the demo school re-seeds itself next time it starts. Uploaded
photos/videos are served through the app itself (at `/media/...`) rather
than as static files, so this one folder is the only thing that needs to
persist in production — see **Deploying** below.

To run this for a **real** school instead of the demo data, log in as the
admin account and either edit the seeded records or delete the storage
folder and adjust `src/lib/seed.ts` before the first run so it seeds your
real classrooms/staff instead (then change the demo passwords immediately).

## Deploying to Railway (recommended)

Railway is the easiest fit for this app: it keeps a persistent disk (which
this app needs for its SQLite database and uploaded photos) and gives you a
public `https://` URL your client can open from anywhere, on any device.

1. **Push this code to a GitHub repository** (Railway deploys from GitHub).
2. On [railway.app](https://railway.app), click **New Project → Deploy from
   GitHub repo** and pick the repo. Railway auto-detects this as a Next.js
   app and builds it — no config needed beyond what's already in
   `railway.json`.
3. Add a **Volume**: in the service's *Settings → Volumes* tab, create a
   volume and mount it at `/data`.
4. Add two **Variables** (*Variables* tab):
   - `STORAGE_DIR` = `/data` (matches the volume mount path above)
   - `AUTH_SECRET` = a long random string — generate one with
     `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
5. Under *Settings → Networking*, click **Generate Domain** to get a public
   `https://your-app.up.railway.app` URL.
6. Redeploy if needed (Railway usually does this automatically after adding
   variables/volumes). Share the URL with your client — the demo school
   data seeds itself on first boot, so it's ready to click through
   immediately, with real signups replacing it as you use the admin account
   to make it your own.

## Deploying elsewhere

This app has no hard dependency on Railway — it's a standard Next.js app, so
it also runs on Render, a VPS, Docker, etc. The same two things apply
anywhere:

- **`AUTH_SECRET`** — set this environment variable to a long random string
  in production (session cookies are signed with it). If unset, a
  development fallback is used, which is fine for local testing only.
- **A persistent volume mounted at the path you set `STORAGE_DIR` to** —
  because data lives in a local SQLite file and local uploads folder, this
  needs to survive restarts and redeploys. Purely serverless platforms that
  reset the filesystem between requests (e.g. Vercel's default serverless
  functions) will not persist data between requests — for those, swap
  `node:sqlite` for a hosted database and file uploads for object storage
  (S3-compatible) instead.

## Important notes before using this with real children's data

This app handles sensitive information about children and families. Before
using it for anything beyond a demo:

- Put it behind HTTPS, set a strong unique `AUTH_SECRET`, and take regular
  backups of `data/app.db`.
- Review your local child-data-protection and safeguarding requirements
  (for the Dominican Republic, that includes Law 172-13 on personal data
  protection) and your school's own privacy policy before storing real
  photos, health, or contact information.
- Payments here are recorded manually by staff (cash/card/transfer/check).
  No payment processor is connected — wiring up a real one (e.g. Stripe)
  needs API keys you provide and isn't included by default.
- Passwords are hashed, but there's no password-reset flow, 2FA, or account
  lockout yet — add those before rolling this out to real families at scale.

## Project structure

```
src/
  app/
    (staff)/        staff-facing pages (dashboard, check-in, students, ...)
    parent/         parent-facing portal
    login/          shared login for both staff and parents
    media/[...path] serves uploaded photos/videos from STORAGE_DIR
  components/       shared UI (nav shells, cards, badges, logo, avatar)
  lib/
    db.ts           SQLite connection + schema
    storage.ts       resolves STORAGE_DIR -> db path + uploads folder
    seed.ts         demo data generator (auto-runs once)
    auth.ts         sessions, password hashing
    queries.ts      all read queries
    types.ts        shared TypeScript types
    format.ts       small formatting helpers
public/
  brand/logo.jpeg   Early Steps English logo
railway.json        Railway build/deploy config
```
