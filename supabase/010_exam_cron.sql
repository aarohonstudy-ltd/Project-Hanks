-- Enable pg_cron in Supabase Dashboard > Integrations > Cron first.
-- Run as the SQL Editor postgres role AFTER 009. Repeatable; updates this job only.
SELECT cron.schedule(
 'aarohon-expire-exams',
 '* * * * *',
 $$SELECT aarohon_private.expire_exams();$$
);
-- Should show active=true. Deadline is enforced immediately by the API;
-- this job finalizes closed-browser attempts on its next run (normally <= 60 seconds).
SELECT jobid,jobname,schedule,active FROM cron.job WHERE jobname='aarohon-expire-exams';
