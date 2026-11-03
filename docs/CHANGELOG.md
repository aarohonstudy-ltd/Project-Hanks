# Changelog

Older per-feature update notes, merged into one file. Full file lists are in `git log`.
SQL files are in `supabase/`; run only the ones a note names, in order, and never re-run old
migrations after newer ones (they can restore old functions).

## Completed exam button — `018_exam_completed_cards.sql` (after 017)
- Submitted/expired exams show a disabled "পরীক্ষা দেওয়া হয়েছে" button, even before results are published.
- A running attempt does not count as completed; practice can be repeated. Backend repeat-attempt rule is unchanged.

## Exam enrollment cards — `017_exam_enrollment_cards.sql`
- Exam access follows the exam's `course_id` and `is_free`, not the question topics. For a course-only exam pick the course and keep "সবার জন্য ফ্রি" off.
- Course-only exam without an active enrollment: Start is disabled and the card links to the catalog. Pending request: Start disabled, "অনুমোদন অপেক্ষমাণ". Expired/revoked: locked.
- The server re-checks enrollment on every start request. Free exams are unchanged; upcoming exams allow a reminder.

## Auto exam builder — `016_exam_builder.sql`
- Admin → পরীক্ষা → নতুন পরীক্ষা: pick random questions per topic (quota) or from a whole topic pool, with difficulty filter. Questions already in published exams or attempts are excluded by default. Max 200; shortages are reported, never silently filled.
- Manual add/remove/reorder, per-question marks and negative marks, "apply to all".
- **Preview / Demo** runs fully in memory (no attempts, results or leaderboard changes). "সম্পাদনা · নতুন কপি" creates a new question instead of editing a used one.
- Every non-archived exam can be archived; blocked while a student attempt is running.
- New exams can be added to several courses at once: one exam is created per selected course (same questions and settings).

## Session lifetime and dashboard loading — `014_session_lifetime.sql`, then `015_dashboard_loading.sql`
- App-level session limit enforced in the database: students 7 days, admins 12 hours from login (not an inactivity timeout). Old logins may need to sign in again. Exam start needs the exam deadline + 5 minutes left on the session.
- Dashboard payload is lighter: question bank, bookmarks and mistakes are server-paginated (20 per page); analytics and result explanations load on demand.
- Dashboard fetches slower than 1.5 s log `[aarohon:dashboard]` with `totalMs` (no user data).

## Google login and dashboard speed (no SQL)
- Google callback redirects straight to `/admin` or `/dashboard` using the profile role.
- `proxy.ts` runs only on `/dashboard` and `/admin` and uses `getClaims()`. Dashboard RPC and profile query run in parallel; `requireAdmin()` is cached per render.

## Notification dropdown and admin navigation (no SQL)
- Bell opens a popover (closes on outside click/Escape); push settings sit under the notifications.
- Admin sidebar/header live in the shared `admin/layout.tsx`, so only the content area changes between sections.
