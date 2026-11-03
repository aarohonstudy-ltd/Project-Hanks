# Aarohon

Bangla online exam-prep academy: a public site with courses and free model tests, a student
dashboard (live/model exams, practice, question bank, mistakes, bookmarks, classroom,
analytics, leaderboard, referral) and an admin panel (courses, lessons, questions, exams with
an auto builder, students, enrollment requests, results, notifications, audit).

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Supabase (auth, Postgres, RPC) ·
Tailwind CSS 4 · shadcn/Radix UI · Web Push.

> Next.js here has breaking changes from older versions. See `AGENTS.md` and
> `node_modules/next/dist/docs/` before changing framework-level code.

## Getting started

```bash
npm ci
cp .env.example .env.local   # if there is no .env.example, create .env.local with the variables below
npm run dev                  # http://localhost:3000
```

Other scripts: `npm run build`, `npm run start`, `npm run lint`.

### Environment variables

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable (anon) key |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` | Web Push (see `docs/setup/EXAM-PUSH-START-HERE.md`) |

No service-role key is needed.

## Database

SQL migrations live in `supabase/` and are run by hand in the Supabase SQL Editor,
in numeric order (`001` … `018`). Never re-run `001_setup.sql` or an older migration after
newer ones. Start with `docs/setup/SUPABASE-START-HERE.md`; make yourself an admin with
`004_make_admin.sql`.

## Docs

- `docs/setup/` — step-by-step guides (in Bangla): `SUPABASE-START-HERE`, `ADMIN-START-HERE`,
  `COURSE-START-HERE`, `HOME-CSV-START-HERE`, `LIVE-EXAM-START-HERE`, `LEADERBOARD-START-HERE`,
  `EXAM-PUSH-START-HERE`
- `docs/CHANGELOG.md` — feature notes and which migration each one needs

## Layout

```
src/app/            routes: (publicGroup) (authGroup) (dashboardGroup) (adminGroup), api/
src/components/     admin/, student/, shared/, ui/
src/lib/            student/, admin/, academy/, notifications/, supabase/
src/proxy.ts        refreshes the Supabase session for /dashboard and /admin
supabase/           SQL migrations
```
