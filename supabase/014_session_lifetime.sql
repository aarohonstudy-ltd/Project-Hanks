-- Run after 013. App-level absolute session lifetime; does not change Supabase Auth settings.
-- Repeatable. Existing sessions are measured from their ORIGINAL Auth creation time.
BEGIN;
CREATE OR REPLACE FUNCTION aarohon_private.session_expires_at() RETURNS timestamptz
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT least(s.created_at + CASE WHEN p.role='admin' THEN interval '12 hours' ELSE interval '7 days' END,
 coalesce(s.not_after,'infinity'::timestamptz))
 FROM auth.sessions s JOIN public.profiles p ON p.id=s.user_id
 WHERE s.id=nullif(auth.jwt()->>'session_id','')::uuid AND s.user_id=auth.uid() AND p.status='active'
$$;
CREATE OR REPLACE FUNCTION aarohon_private.session_valid() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT coalesce(aarohon_private.session_expires_at()>now(),false)
$$;
REVOKE ALL ON FUNCTION aarohon_private.session_expires_at(),aarohon_private.session_valid() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION aarohon_private.session_valid() TO authenticated;
CREATE OR REPLACE FUNCTION public.aarohon_session_status() RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT jsonb_build_object('valid',aarohon_private.session_valid(),'expiresAt',aarohon_private.session_expires_at(),'serverNow',now())
$$;
REVOKE ALL ON FUNCTION public.aarohon_session_status() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.aarohon_session_status() TO authenticated;
CREATE OR REPLACE FUNCTION aarohon_private.require_student() RETURNS uuid
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE u uuid:=auth.uid(); BEGIN
 IF NOT aarohon_private.session_valid() THEN RAISE EXCEPTION 'সেশন শেষ হয়েছে। আবার লগইন করুন।' USING ERRCODE='PT401'; END IF;
 RETURN u;
END $$;
CREATE OR REPLACE FUNCTION aarohon_private.require_admin() RETURNS uuid
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE u uuid:=aarohon_private.require_student(); BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=u AND role='admin' AND status='active') THEN
 RAISE EXCEPTION 'Admin access required' USING ERRCODE='42501'; END IF;
 RETURN u;
END $$;
REVOKE ALL ON FUNCTION aarohon_private.require_student(),aarohon_private.require_admin() FROM PUBLIC,anon,authenticated;
-- Restrictive policies supplement (never replace) existing ownership/enrollment policies.
DROP POLICY IF EXISTS aarohon_session_lifetime ON public.profiles;
CREATE POLICY aarohon_session_lifetime ON public.profiles AS RESTRICTIVE FOR ALL TO authenticated USING ((SELECT aarohon_private.session_valid())) WITH CHECK ((SELECT aarohon_private.session_valid()));
DROP POLICY IF EXISTS aarohon_session_lifetime ON public.courses;
CREATE POLICY aarohon_session_lifetime ON public.courses AS RESTRICTIVE FOR ALL TO authenticated USING ((SELECT aarohon_private.session_valid())) WITH CHECK ((SELECT aarohon_private.session_valid()));
DROP POLICY IF EXISTS aarohon_session_lifetime ON public.subjects;
CREATE POLICY aarohon_session_lifetime ON public.subjects AS RESTRICTIVE FOR ALL TO authenticated USING ((SELECT aarohon_private.session_valid())) WITH CHECK ((SELECT aarohon_private.session_valid()));
DROP POLICY IF EXISTS aarohon_session_lifetime ON public.course_subjects;
CREATE POLICY aarohon_session_lifetime ON public.course_subjects AS RESTRICTIVE FOR ALL TO authenticated USING ((SELECT aarohon_private.session_valid())) WITH CHECK ((SELECT aarohon_private.session_valid()));
DROP POLICY IF EXISTS aarohon_session_lifetime ON public.topics;
CREATE POLICY aarohon_session_lifetime ON public.topics AS RESTRICTIVE FOR ALL TO authenticated USING ((SELECT aarohon_private.session_valid())) WITH CHECK ((SELECT aarohon_private.session_valid()));
DROP POLICY IF EXISTS aarohon_session_lifetime ON public.lessons;
CREATE POLICY aarohon_session_lifetime ON public.lessons AS RESTRICTIVE FOR ALL TO authenticated USING ((SELECT aarohon_private.session_valid())) WITH CHECK ((SELECT aarohon_private.session_valid()));
DROP POLICY IF EXISTS aarohon_session_lifetime ON public.enrollments;
CREATE POLICY aarohon_session_lifetime ON public.enrollments AS RESTRICTIVE FOR ALL TO authenticated USING ((SELECT aarohon_private.session_valid())) WITH CHECK ((SELECT aarohon_private.session_valid()));
DROP POLICY IF EXISTS aarohon_session_lifetime ON public.lesson_progress;
CREATE POLICY aarohon_session_lifetime ON public.lesson_progress AS RESTRICTIVE FOR ALL TO authenticated USING ((SELECT aarohon_private.session_valid())) WITH CHECK ((SELECT aarohon_private.session_valid()));
DROP POLICY IF EXISTS aarohon_session_lifetime ON public.coupons;
CREATE POLICY aarohon_session_lifetime ON public.coupons AS RESTRICTIVE FOR ALL TO authenticated USING ((SELECT aarohon_private.session_valid())) WITH CHECK ((SELECT aarohon_private.session_valid()));
DROP POLICY IF EXISTS aarohon_session_lifetime ON public.enrollment_requests;
CREATE POLICY aarohon_session_lifetime ON public.enrollment_requests AS RESTRICTIVE FOR ALL TO authenticated USING ((SELECT aarohon_private.session_valid())) WITH CHECK ((SELECT aarohon_private.session_valid()));
DROP POLICY IF EXISTS aarohon_session_lifetime ON public.payments;
CREATE POLICY aarohon_session_lifetime ON public.payments AS RESTRICTIVE FOR ALL TO authenticated USING ((SELECT aarohon_private.session_valid())) WITH CHECK ((SELECT aarohon_private.session_valid()));
DROP POLICY IF EXISTS aarohon_session_lifetime ON public.payment_items;
CREATE POLICY aarohon_session_lifetime ON public.payment_items AS RESTRICTIVE FOR ALL TO authenticated USING ((SELECT aarohon_private.session_valid())) WITH CHECK ((SELECT aarohon_private.session_valid()));
DROP POLICY IF EXISTS aarohon_session_lifetime ON public.questions;
CREATE POLICY aarohon_session_lifetime ON public.questions AS RESTRICTIVE FOR ALL TO authenticated USING ((SELECT aarohon_private.session_valid())) WITH CHECK ((SELECT aarohon_private.session_valid()));
DROP POLICY IF EXISTS aarohon_session_lifetime ON public.question_options;
CREATE POLICY aarohon_session_lifetime ON public.question_options AS RESTRICTIVE FOR ALL TO authenticated USING ((SELECT aarohon_private.session_valid())) WITH CHECK ((SELECT aarohon_private.session_valid()));
DROP POLICY IF EXISTS aarohon_session_lifetime ON public.question_answer_keys;
CREATE POLICY aarohon_session_lifetime ON public.question_answer_keys AS RESTRICTIVE FOR ALL TO authenticated USING ((SELECT aarohon_private.session_valid())) WITH CHECK ((SELECT aarohon_private.session_valid()));
DROP POLICY IF EXISTS aarohon_session_lifetime ON public.exams;
CREATE POLICY aarohon_session_lifetime ON public.exams AS RESTRICTIVE FOR ALL TO authenticated USING ((SELECT aarohon_private.session_valid())) WITH CHECK ((SELECT aarohon_private.session_valid()));
DROP POLICY IF EXISTS aarohon_session_lifetime ON public.exam_questions;
CREATE POLICY aarohon_session_lifetime ON public.exam_questions AS RESTRICTIVE FOR ALL TO authenticated USING ((SELECT aarohon_private.session_valid())) WITH CHECK ((SELECT aarohon_private.session_valid()));
DROP POLICY IF EXISTS aarohon_session_lifetime ON public.exam_attempts;
CREATE POLICY aarohon_session_lifetime ON public.exam_attempts AS RESTRICTIVE FOR ALL TO authenticated USING ((SELECT aarohon_private.session_valid())) WITH CHECK ((SELECT aarohon_private.session_valid()));
DROP POLICY IF EXISTS aarohon_session_lifetime ON public.attempt_answers;
CREATE POLICY aarohon_session_lifetime ON public.attempt_answers AS RESTRICTIVE FOR ALL TO authenticated USING ((SELECT aarohon_private.session_valid())) WITH CHECK ((SELECT aarohon_private.session_valid()));
DROP POLICY IF EXISTS aarohon_session_lifetime ON public.practice_sessions;
CREATE POLICY aarohon_session_lifetime ON public.practice_sessions AS RESTRICTIVE FOR ALL TO authenticated USING ((SELECT aarohon_private.session_valid())) WITH CHECK ((SELECT aarohon_private.session_valid()));
DROP POLICY IF EXISTS aarohon_session_lifetime ON public.practice_answers;
CREATE POLICY aarohon_session_lifetime ON public.practice_answers AS RESTRICTIVE FOR ALL TO authenticated USING ((SELECT aarohon_private.session_valid())) WITH CHECK ((SELECT aarohon_private.session_valid()));
DROP POLICY IF EXISTS aarohon_session_lifetime ON public.bookmarks;
CREATE POLICY aarohon_session_lifetime ON public.bookmarks AS RESTRICTIVE FOR ALL TO authenticated USING ((SELECT aarohon_private.session_valid())) WITH CHECK ((SELECT aarohon_private.session_valid()));
DROP POLICY IF EXISTS aarohon_session_lifetime ON public.question_reads;
CREATE POLICY aarohon_session_lifetime ON public.question_reads AS RESTRICTIVE FOR ALL TO authenticated USING ((SELECT aarohon_private.session_valid())) WITH CHECK ((SELECT aarohon_private.session_valid()));
DROP POLICY IF EXISTS aarohon_session_lifetime ON public.mistake_reviews;
CREATE POLICY aarohon_session_lifetime ON public.mistake_reviews AS RESTRICTIVE FOR ALL TO authenticated USING ((SELECT aarohon_private.session_valid())) WITH CHECK ((SELECT aarohon_private.session_valid()));
DROP POLICY IF EXISTS aarohon_session_lifetime ON public.study_activity;
CREATE POLICY aarohon_session_lifetime ON public.study_activity AS RESTRICTIVE FOR ALL TO authenticated USING ((SELECT aarohon_private.session_valid())) WITH CHECK ((SELECT aarohon_private.session_valid()));
DROP POLICY IF EXISTS aarohon_session_lifetime ON public.referral_codes;
CREATE POLICY aarohon_session_lifetime ON public.referral_codes AS RESTRICTIVE FOR ALL TO authenticated USING ((SELECT aarohon_private.session_valid())) WITH CHECK ((SELECT aarohon_private.session_valid()));
DROP POLICY IF EXISTS aarohon_session_lifetime ON public.referrals;
CREATE POLICY aarohon_session_lifetime ON public.referrals AS RESTRICTIVE FOR ALL TO authenticated USING ((SELECT aarohon_private.session_valid())) WITH CHECK ((SELECT aarohon_private.session_valid()));
DROP POLICY IF EXISTS aarohon_session_lifetime ON public.referral_rewards;
CREATE POLICY aarohon_session_lifetime ON public.referral_rewards AS RESTRICTIVE FOR ALL TO authenticated USING ((SELECT aarohon_private.session_valid())) WITH CHECK ((SELECT aarohon_private.session_valid()));
DROP POLICY IF EXISTS aarohon_session_lifetime ON public.notifications;
CREATE POLICY aarohon_session_lifetime ON public.notifications AS RESTRICTIVE FOR ALL TO authenticated USING ((SELECT aarohon_private.session_valid())) WITH CHECK ((SELECT aarohon_private.session_valid()));
DROP POLICY IF EXISTS aarohon_session_lifetime ON public.notification_recipients;
CREATE POLICY aarohon_session_lifetime ON public.notification_recipients AS RESTRICTIVE FOR ALL TO authenticated USING ((SELECT aarohon_private.session_valid())) WITH CHECK ((SELECT aarohon_private.session_valid()));
DROP POLICY IF EXISTS aarohon_session_lifetime ON public.exam_reminders;
CREATE POLICY aarohon_session_lifetime ON public.exam_reminders AS RESTRICTIVE FOR ALL TO authenticated USING ((SELECT aarohon_private.session_valid())) WITH CHECK ((SELECT aarohon_private.session_valid()));
DROP POLICY IF EXISTS aarohon_session_lifetime ON public.news;
CREATE POLICY aarohon_session_lifetime ON public.news AS RESTRICTIVE FOR ALL TO authenticated USING ((SELECT aarohon_private.session_valid())) WITH CHECK ((SELECT aarohon_private.session_valid()));
DROP POLICY IF EXISTS aarohon_session_lifetime ON public.news_reads;
CREATE POLICY aarohon_session_lifetime ON public.news_reads AS RESTRICTIVE FOR ALL TO authenticated USING ((SELECT aarohon_private.session_valid())) WITH CHECK ((SELECT aarohon_private.session_valid()));
DROP POLICY IF EXISTS aarohon_session_lifetime ON public.site_settings;
CREATE POLICY aarohon_session_lifetime ON public.site_settings AS RESTRICTIVE FOR ALL TO authenticated USING ((SELECT aarohon_private.session_valid())) WITH CHECK ((SELECT aarohon_private.session_valid()));
DROP POLICY IF EXISTS aarohon_session_lifetime ON public.audit_logs;
CREATE POLICY aarohon_session_lifetime ON public.audit_logs AS RESTRICTIVE FOR ALL TO authenticated USING ((SELECT aarohon_private.session_valid())) WITH CHECK ((SELECT aarohon_private.session_valid()));
DROP POLICY IF EXISTS aarohon_session_lifetime ON public.push_subscriptions;
CREATE POLICY aarohon_session_lifetime ON public.push_subscriptions AS RESTRICTIVE FOR ALL TO authenticated USING ((SELECT aarohon_private.session_valid())) WITH CHECK ((SELECT aarohon_private.session_valid()));
DROP POLICY IF EXISTS aarohon_session_lifetime ON public.push_campaigns;
CREATE POLICY aarohon_session_lifetime ON public.push_campaigns AS RESTRICTIVE FOR ALL TO authenticated USING ((SELECT aarohon_private.session_valid())) WITH CHECK ((SELECT aarohon_private.session_valid()));
DROP POLICY IF EXISTS aarohon_session_lifetime ON public.push_deliveries;
CREATE POLICY aarohon_session_lifetime ON public.push_deliveries AS RESTRICTIVE FOR ALL TO authenticated USING ((SELECT aarohon_private.session_valid())) WITH CHECK ((SELECT aarohon_private.session_valid()));
DROP POLICY IF EXISTS aarohon_session_lifetime ON public.exam_focus_events;
CREATE POLICY aarohon_session_lifetime ON public.exam_focus_events AS RESTRICTIVE FOR ALL TO authenticated USING ((SELECT aarohon_private.session_valid())) WITH CHECK ((SELECT aarohon_private.session_valid()));
DROP POLICY IF EXISTS aarohon_session_lifetime ON storage.objects;
CREATE POLICY aarohon_session_lifetime ON storage.objects AS RESTRICTIVE FOR ALL TO authenticated
USING (bucket_id NOT IN ('course-images','course-materials') OR (SELECT aarohon_private.session_valid()))
WITH CHECK (bucket_id NOT IN ('course-images','course-materials') OR (SELECT aarohon_private.session_valid()));
COMMIT;
