-- READ ONLY. Run after 001_setup.sql (optional demo content does not affect these counts).
SELECT 'application_tables' AS check_name, count(*)::text AS result
FROM pg_tables WHERE schemaname='public'
UNION ALL
SELECT 'tables_with_rls',count(*)::text FROM pg_tables WHERE schemaname='public' AND rowsecurity
UNION ALL
SELECT 'schema_version',value::text FROM public.site_settings WHERE key='schema_version'
UNION ALL
SELECT 'signup_profile_trigger',count(*)::text FROM pg_trigger
WHERE tgname='aarohon_user_created' AND tgrelid='auth.users'::regclass AND NOT tgisinternal;
-- Expected: 35 tables; 35 with RLS; version 1; 1 profile trigger.

SELECT has_table_privilege('authenticated','public.question_answer_keys','SELECT') AS student_can_read_answer_keys,
       has_column_privilege('authenticated','public.profiles','role','UPDATE') AS student_can_change_role,
       has_table_privilege('authenticated','public.payments','UPDATE') AS student_can_approve_payment,
       has_table_privilege('authenticated','public.enrollments','INSERT') AS student_can_self_enroll,
       has_column_privilege('authenticated','public.profiles','full_name','UPDATE') AS student_can_edit_name;
-- Expected: false, false, false, false, true.

SELECT id,full_name,role,status FROM public.profiles ORDER BY created_at DESC LIMIT 10;
-- Empty until an Auth user exists. Do not publicly share real users' profile output.
