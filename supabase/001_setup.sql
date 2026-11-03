-- AAROHON: fresh Supabase database setup v1 (2026-10-10)
-- Run ONCE in a NEW EMPTY Supabase project's SQL Editor, as postgres.
-- No old accounts, enrollments, results, payments or legacy user mappings.
-- This transaction fails rather than overwriting an existing application schema.
-- Application API, grading, payment approval, import and reminders are separate work.
BEGIN;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
             WHERE n.nspname='public' AND c.relkind IN ('r','p')) THEN
    RAISE EXCEPTION 'Public tables already exist. Use a fresh empty project; do not run this setup on your old database.';
  END IF;
END $$;

CREATE TABLE public.profiles (
id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE RESTRICT,
full_name text NOT NULL DEFAULT '', phone text, avatar_url text, preparation_goal text,
role text NOT NULL DEFAULT 'student' CHECK (role IN ('student','teacher','admin')),
status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended')),
created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.courses (
id uuid PRIMARY KEY DEFAULT gen_random_uuid(), slug text NOT NULL UNIQUE, title text NOT NULL,
description text NOT NULL DEFAULT '', thumbnail_url text,
price numeric(12,2) NOT NULL DEFAULT 0 CHECK(price >= 0),
offer_price numeric(12,2) CHECK(offer_price >= 0 AND offer_price <= price),
whatsapp_url text, status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published','archived')),
created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.subjects (
id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL UNIQUE, created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.course_subjects (
course_id uuid NOT NULL REFERENCES public.courses(id),
subject_id uuid NOT NULL REFERENCES public.subjects(id), PRIMARY KEY(course_id,subject_id)
);

CREATE TABLE public.topics (
id uuid PRIMARY KEY DEFAULT gen_random_uuid(), subject_id uuid NOT NULL REFERENCES public.subjects(id), parent_id uuid,
name text NOT NULL, UNIQUE(id,subject_id), CHECK(parent_id IS NULL OR parent_id <> id),
FOREIGN KEY(parent_id,subject_id) REFERENCES public.topics(id,subject_id), created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.lessons (
id uuid PRIMARY KEY DEFAULT gen_random_uuid(), course_id uuid NOT NULL REFERENCES public.courses(id),
topic_id uuid REFERENCES public.topics(id), title text NOT NULL, content text NOT NULL DEFAULT '',
video_url text, position integer NOT NULL CHECK(position >= 0), is_preview boolean NOT NULL DEFAULT false,
status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published','archived')),
UNIQUE(course_id,position), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.enrollments (
id uuid PRIMARY KEY DEFAULT gen_random_uuid(), student_id uuid NOT NULL REFERENCES public.profiles(id),
course_id uuid NOT NULL REFERENCES public.courses(id),
status text NOT NULL DEFAULT 'active' CHECK(status IN ('active','expired','revoked')),
enrolled_at timestamptz NOT NULL DEFAULT now(), expires_at timestamptz,
UNIQUE(student_id,course_id), UNIQUE(id,student_id,course_id),
CHECK(expires_at IS NULL OR expires_at > enrolled_at)
);

CREATE TABLE public.lesson_progress (
student_id uuid NOT NULL REFERENCES public.profiles(id),
lesson_id uuid NOT NULL REFERENCES public.lessons(id), watched_seconds integer NOT NULL DEFAULT 0 CHECK(watched_seconds >= 0),
completed_at timestamptz, updated_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(student_id,lesson_id)
);

CREATE TABLE public.coupons (
id uuid PRIMARY KEY DEFAULT gen_random_uuid(), code text NOT NULL UNIQUE CHECK(code = upper(code)),
discount_type text NOT NULL CHECK(discount_type IN ('fixed','percent')),
discount_value numeric(12,2) NOT NULL CHECK(discount_value > 0),
usage_limit integer CHECK(usage_limit > 0), starts_at timestamptz, expires_at timestamptz,
is_active boolean NOT NULL DEFAULT true,
CHECK(discount_type <> 'percent' OR discount_value <= 100),
CHECK(expires_at IS NULL OR starts_at IS NULL OR expires_at > starts_at), created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.enrollment_requests (
id uuid PRIMARY KEY DEFAULT gen_random_uuid(), student_id uuid NOT NULL REFERENCES public.profiles(id),
course_id uuid NOT NULL REFERENCES public.courses(id), coupon_id uuid REFERENCES public.coupons(id),
status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected','cancelled')),
reviewed_by uuid REFERENCES public.profiles(id), reviewed_at timestamptz,
UNIQUE(id,student_id,course_id), created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.payments (
id uuid PRIMARY KEY DEFAULT gen_random_uuid(), student_id uuid NOT NULL REFERENCES public.profiles(id),
reviewed_by uuid REFERENCES public.profiles(id), amount numeric(12,2) NOT NULL CHECK(amount >= 0),
currency text NOT NULL DEFAULT 'BDT' CHECK(char_length(currency)=3),
method text NOT NULL CHECK(method IN ('bkash','nagad','bank','cash','gateway')),
transaction_ref text, status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected','refunded')),
paid_at timestamptz, UNIQUE(id,student_id), UNIQUE(method,transaction_ref), created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.payment_items (
id uuid PRIMARY KEY DEFAULT gen_random_uuid(), payment_id uuid NOT NULL, request_id uuid NOT NULL,
enrollment_id uuid, student_id uuid NOT NULL REFERENCES public.profiles(id),
course_id uuid NOT NULL REFERENCES public.courses(id),
amount numeric(12,2) NOT NULL CHECK(amount >= 0), discount numeric(12,2) NOT NULL DEFAULT 0 CHECK(discount >= 0),
FOREIGN KEY(payment_id,student_id) REFERENCES public.payments(id,student_id),
FOREIGN KEY(request_id,student_id,course_id) REFERENCES public.enrollment_requests(id,student_id,course_id),
FOREIGN KEY(enrollment_id,student_id,course_id) REFERENCES public.enrollments(id,student_id,course_id),
UNIQUE(payment_id,request_id)
);

CREATE TABLE public.questions (
id uuid PRIMARY KEY DEFAULT gen_random_uuid(), topic_id uuid NOT NULL REFERENCES public.topics(id),
created_by uuid REFERENCES public.profiles(id), question_text text NOT NULL, explanation text NOT NULL DEFAULT '',
difficulty text NOT NULL DEFAULT 'medium' CHECK(difficulty IN ('easy','medium','hard')),
status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published','archived')),
created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.question_options (
id uuid PRIMARY KEY DEFAULT gen_random_uuid(), question_id uuid NOT NULL REFERENCES public.questions(id),
option_text text NOT NULL, position integer NOT NULL CHECK(position >= 0),
UNIQUE(question_id,position), UNIQUE(question_id,id)
);

CREATE TABLE public.question_answer_keys (
question_id uuid PRIMARY KEY REFERENCES public.questions(id),
correct_option_id uuid NOT NULL,
FOREIGN KEY(question_id,correct_option_id) REFERENCES public.question_options(question_id,id)
);

CREATE TABLE public.exams (
id uuid PRIMARY KEY DEFAULT gen_random_uuid(), course_id uuid REFERENCES public.courses(id), created_by uuid REFERENCES public.profiles(id),
title text NOT NULL, exam_type text NOT NULL DEFAULT 'model_test' CHECK(exam_type IN ('live','model_test')),
status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published','archived')),
duration_minutes integer NOT NULL CHECK(duration_minutes > 0),
pass_mark numeric(10,2) NOT NULL DEFAULT 0 CHECK(pass_mark >= 0),
is_free boolean NOT NULL DEFAULT false, starts_at timestamptz, ends_at timestamptz,
results_at timestamptz, answers_at timestamptz,
CHECK(ends_at IS NULL OR starts_at IS NULL OR ends_at > starts_at),
CHECK(exam_type <> 'live' OR (starts_at IS NOT NULL AND ends_at IS NOT NULL)),
CHECK(is_free OR course_id IS NOT NULL), created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.exam_questions (
exam_id uuid NOT NULL REFERENCES public.exams(id),
question_id uuid NOT NULL REFERENCES public.questions(id), position integer NOT NULL CHECK(position >= 0),
marks numeric(10,2) NOT NULL DEFAULT 1 CHECK(marks > 0),
negative_marks numeric(10,2) NOT NULL DEFAULT 0 CHECK(negative_marks >= 0 AND negative_marks <= marks),
PRIMARY KEY(exam_id,question_id), UNIQUE(exam_id,position)
);

CREATE TABLE public.exam_attempts (
id uuid PRIMARY KEY DEFAULT gen_random_uuid(), student_id uuid NOT NULL REFERENCES public.profiles(id),
exam_id uuid NOT NULL REFERENCES public.exams(id), attempt_number integer NOT NULL DEFAULT 1 CHECK(attempt_number > 0),
status text NOT NULL DEFAULT 'in_progress' CHECK(status IN ('in_progress','submitted','expired','void')),
started_at timestamptz NOT NULL DEFAULT now(), deadline_at timestamptz NOT NULL,
submitted_at timestamptz, score numeric(10,2),
correct_count integer NOT NULL DEFAULT 0 CHECK(correct_count >= 0),
wrong_count integer NOT NULL DEFAULT 0 CHECK(wrong_count >= 0),
skipped_count integer NOT NULL DEFAULT 0 CHECK(skipped_count >= 0),
CHECK(deadline_at > started_at), CHECK(submitted_at IS NULL OR submitted_at >= started_at),
UNIQUE(student_id,exam_id,attempt_number), UNIQUE(id,exam_id)
);

CREATE TABLE public.attempt_answers (
attempt_id uuid NOT NULL, exam_id uuid NOT NULL,
question_id uuid NOT NULL, selected_option_id uuid, is_correct boolean, awarded_marks numeric(10,2),
PRIMARY KEY(attempt_id,question_id),
FOREIGN KEY(attempt_id,exam_id) REFERENCES public.exam_attempts(id,exam_id),
FOREIGN KEY(exam_id,question_id) REFERENCES public.exam_questions(exam_id,question_id),
FOREIGN KEY(question_id,selected_option_id) REFERENCES public.question_options(question_id,id)
);

CREATE TABLE public.practice_sessions (
id uuid PRIMARY KEY DEFAULT gen_random_uuid(), student_id uuid NOT NULL REFERENCES public.profiles(id),
topic_id uuid REFERENCES public.topics(id), status text NOT NULL DEFAULT 'in_progress' CHECK(status IN ('in_progress','completed','abandoned')),
started_at timestamptz NOT NULL DEFAULT now(), completed_at timestamptz,
CHECK(completed_at IS NULL OR completed_at >= started_at)
);

CREATE TABLE public.practice_answers (
session_id uuid NOT NULL REFERENCES public.practice_sessions(id),
question_id uuid NOT NULL REFERENCES public.questions(id), selected_option_id uuid,
position integer NOT NULL CHECK(position >= 0), is_correct boolean,
PRIMARY KEY(session_id,question_id), UNIQUE(session_id,position),
FOREIGN KEY(question_id,selected_option_id) REFERENCES public.question_options(question_id,id)
);

CREATE TABLE public.bookmarks (
student_id uuid NOT NULL REFERENCES public.profiles(id), question_id uuid NOT NULL REFERENCES public.questions(id),
created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(student_id,question_id)
);

CREATE TABLE public.question_reads (
student_id uuid NOT NULL REFERENCES public.profiles(id), question_id uuid NOT NULL REFERENCES public.questions(id),
read_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(student_id,question_id)
);

CREATE TABLE public.mistake_reviews (
student_id uuid NOT NULL REFERENCES public.profiles(id), question_id uuid NOT NULL REFERENCES public.questions(id),
review_status text NOT NULL DEFAULT 'pending' CHECK(review_status IN ('pending','reviewed','mastered')), reviewed_at timestamptz, PRIMARY KEY(student_id,question_id)
);

CREATE TABLE public.study_activity (
student_id uuid NOT NULL REFERENCES public.profiles(id), activity_date date NOT NULL,
questions_answered integer NOT NULL DEFAULT 0 CHECK(questions_answered >= 0),
lessons_completed integer NOT NULL DEFAULT 0 CHECK(lessons_completed >= 0), PRIMARY KEY(student_id,activity_date)
);

CREATE TABLE public.referral_codes (
id uuid PRIMARY KEY DEFAULT gen_random_uuid(), student_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id),
code text NOT NULL UNIQUE, is_active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.referrals (
id uuid PRIMARY KEY DEFAULT gen_random_uuid(), referral_code_id uuid NOT NULL REFERENCES public.referral_codes(id),
referred_student_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id),
qualifying_payment_item_id uuid UNIQUE REFERENCES public.payment_items(id),
status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','qualified','rejected')), created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.referral_rewards (
id uuid PRIMARY KEY DEFAULT gen_random_uuid(), referral_id uuid NOT NULL UNIQUE REFERENCES public.referrals(id),
amount numeric(12,2) NOT NULL CHECK(amount > 0),
status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','paid','cancelled')),
paid_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.notifications (
id uuid PRIMARY KEY DEFAULT gen_random_uuid(), title text NOT NULL, body text NOT NULL,
action_url text, created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.notification_recipients (
notification_id uuid NOT NULL REFERENCES public.notifications(id),
student_id uuid NOT NULL REFERENCES public.profiles(id), read_at timestamptz, PRIMARY KEY(notification_id,student_id)
);

CREATE TABLE public.exam_reminders (
student_id uuid NOT NULL REFERENCES public.profiles(id),
exam_id uuid NOT NULL REFERENCES public.exams(id), remind_at timestamptz NOT NULL,
sent_at timestamptz, PRIMARY KEY(student_id,exam_id)
);

CREATE TABLE public.news (
id uuid PRIMARY KEY DEFAULT gen_random_uuid(), author_id uuid REFERENCES public.profiles(id),
title text NOT NULL, body text NOT NULL,
status text NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published','archived')),
published_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.news_reads (
news_id uuid NOT NULL REFERENCES public.news(id),
student_id uuid NOT NULL REFERENCES public.profiles(id), read_at timestamptz NOT NULL DEFAULT now(),
PRIMARY KEY(news_id,student_id)
);

CREATE TABLE public.site_settings (
key text PRIMARY KEY, value jsonb NOT NULL DEFAULT '{}'::jsonb,
updated_by uuid REFERENCES public.profiles(id), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.audit_logs (
id uuid PRIMARY KEY DEFAULT gen_random_uuid(), actor_id uuid REFERENCES public.profiles(id), action text NOT NULL,
entity_type text NOT NULL, entity_id text, created_at timestamptz NOT NULL DEFAULT now()
);

-- Helper schema is not an exposed Data API schema.
CREATE SCHEMA IF NOT EXISTS aarohon_private;
REVOKE ALL ON SCHEMA aarohon_private FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA aarohon_private TO authenticated;

CREATE FUNCTION aarohon_private.is_active_student_account()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$ SELECT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.status='active') $$;
REVOKE ALL ON FUNCTION aarohon_private.is_active_student_account() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION aarohon_private.is_active_student_account() TO authenticated;

CREATE FUNCTION aarohon_private.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  INSERT INTO public.profiles(id,full_name,avatar_url,role,status)
  VALUES(NEW.id, coalesce(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name',''),
         NEW.raw_user_meta_data->>'avatar_url', 'student','active');
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION aarohon_private.handle_new_user() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER aarohon_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION aarohon_private.handle_new_user();
-- Also handles test Auth users created before running this initial setup.
INSERT INTO public.profiles(id,full_name,avatar_url)
SELECT id,coalesce(raw_user_meta_data->>'full_name',raw_user_meta_data->>'name',''),raw_user_meta_data->>'avatar_url'
FROM auth.users ON CONFLICT(id) DO NOTHING;

CREATE FUNCTION aarohon_private.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN NEW.updated_at=now(); RETURN NEW; END $$;
REVOKE ALL ON FUNCTION aarohon_private.touch_updated_at() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER touch_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION aarohon_private.touch_updated_at();
CREATE TRIGGER touch_updated_at BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION aarohon_private.touch_updated_at();
CREATE TRIGGER touch_updated_at BEFORE UPDATE ON public.lessons FOR EACH ROW EXECUTE FUNCTION aarohon_private.touch_updated_at();
CREATE TRIGGER touch_updated_at BEFORE UPDATE ON public.questions FOR EACH ROW EXECUTE FUNCTION aarohon_private.touch_updated_at();
CREATE TRIGGER touch_updated_at BEFORE UPDATE ON public.lesson_progress FOR EACH ROW EXECUTE FUNCTION aarohon_private.touch_updated_at();
CREATE TRIGGER touch_updated_at BEFORE UPDATE ON public.site_settings FOR EACH ROW EXECUTE FUNCTION aarohon_private.touch_updated_at();

-- Referrals cannot refer the same account or qualify with somebody else's purchase.
CREATE FUNCTION aarohon_private.check_referral()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE owner_id uuid; buyer_id uuid;
BEGIN
  SELECT student_id INTO owner_id FROM public.referral_codes WHERE id=NEW.referral_code_id;
  IF owner_id=NEW.referred_student_id THEN RAISE EXCEPTION 'Self-referral is not permitted'; END IF;
  IF NEW.qualifying_payment_item_id IS NOT NULL THEN
    SELECT student_id INTO buyer_id FROM public.payment_items WHERE id=NEW.qualifying_payment_item_id;
    IF buyer_id IS DISTINCT FROM NEW.referred_student_id THEN RAISE EXCEPTION 'Referral purchase owner mismatch'; END IF;
  END IF;
  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION aarohon_private.check_referral() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER check_referral BEFORE INSERT OR UPDATE ON public.referrals
FOR EACH ROW EXECUTE FUNCTION aarohon_private.check_referral();

-- RLS on EVERY application table. Revoke broad platform default grants.
-- Business mutations go through a trusted, authenticated Next.js server layer.
-- service_role is privileged: never expose it to browsers or mobile apps.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.profiles FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO service_role;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.courses FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.courses TO service_role;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.subjects FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subjects TO service_role;
ALTER TABLE public.course_subjects ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.course_subjects FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_subjects TO service_role;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.topics FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.topics TO service_role;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.lessons FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lessons TO service_role;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.enrollments FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.enrollments TO service_role;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.lesson_progress FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lesson_progress TO service_role;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.coupons FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coupons TO service_role;
ALTER TABLE public.enrollment_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.enrollment_requests FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.enrollment_requests TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.payments FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO service_role;
ALTER TABLE public.payment_items ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.payment_items FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_items TO service_role;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.questions FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.questions TO service_role;
ALTER TABLE public.question_options ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.question_options FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.question_options TO service_role;
ALTER TABLE public.question_answer_keys ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.question_answer_keys FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.question_answer_keys TO service_role;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.exams FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exams TO service_role;
ALTER TABLE public.exam_questions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.exam_questions FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exam_questions TO service_role;
ALTER TABLE public.exam_attempts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.exam_attempts FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exam_attempts TO service_role;
ALTER TABLE public.attempt_answers ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.attempt_answers FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attempt_answers TO service_role;
ALTER TABLE public.practice_sessions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.practice_sessions FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.practice_sessions TO service_role;
ALTER TABLE public.practice_answers ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.practice_answers FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.practice_answers TO service_role;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.bookmarks FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookmarks TO service_role;
ALTER TABLE public.question_reads ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.question_reads FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.question_reads TO service_role;
ALTER TABLE public.mistake_reviews ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.mistake_reviews FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mistake_reviews TO service_role;
ALTER TABLE public.study_activity ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.study_activity FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_activity TO service_role;
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.referral_codes FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.referral_codes TO service_role;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.referrals FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.referrals TO service_role;
ALTER TABLE public.referral_rewards ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.referral_rewards FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.referral_rewards TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.notifications FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO service_role;
ALTER TABLE public.notification_recipients ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.notification_recipients FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_recipients TO service_role;
ALTER TABLE public.exam_reminders ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.exam_reminders FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exam_reminders TO service_role;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.news FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.news TO service_role;
ALTER TABLE public.news_reads ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.news_reads FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.news_reads TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.site_settings FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_settings TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.audit_logs FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.audit_logs TO service_role;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT SELECT ON public.profiles TO authenticated;
CREATE POLICY profiles_read ON public.profiles FOR SELECT TO authenticated USING (id = (SELECT auth.uid()));
GRANT UPDATE(full_name,phone,avatar_url,preparation_goal) ON public.profiles TO authenticated;
CREATE POLICY profiles_update ON public.profiles FOR UPDATE TO authenticated
USING (id=(SELECT auth.uid()) AND (SELECT aarohon_private.is_active_student_account()))
WITH CHECK (id=(SELECT auth.uid()) AND status='active');
GRANT SELECT (id,slug,title,description,thumbnail_url,price,offer_price,status,created_at,updated_at) ON public.courses TO anon, authenticated;
CREATE POLICY courses_read ON public.courses FOR SELECT TO anon, authenticated USING (status='published');
GRANT SELECT ON public.subjects TO anon, authenticated;
CREATE POLICY subjects_read ON public.subjects FOR SELECT TO anon, authenticated USING (true);
GRANT SELECT ON public.topics TO anon, authenticated;
CREATE POLICY topics_read ON public.topics FOR SELECT TO anon, authenticated USING (true);
GRANT SELECT ON public.course_subjects TO anon, authenticated;
CREATE POLICY course_subjects_read ON public.course_subjects FOR SELECT TO anon, authenticated USING (EXISTS(SELECT 1 FROM public.courses c WHERE c.id=course_id AND c.status='published'));
GRANT SELECT ON public.exams TO anon, authenticated;
CREATE POLICY exams_read ON public.exams FOR SELECT TO anon, authenticated USING (status='published' AND (course_id IS NULL OR EXISTS(SELECT 1 FROM public.courses c WHERE c.id=course_id AND c.status='published')));
GRANT SELECT ON public.news TO anon, authenticated;
CREATE POLICY news_read ON public.news FOR SELECT TO anon, authenticated USING (status='published' AND published_at <= now());
GRANT SELECT ON public.enrollments TO authenticated;
CREATE POLICY enrollments_read ON public.enrollments FOR SELECT TO authenticated USING (student_id = (SELECT auth.uid()) AND (SELECT aarohon_private.is_active_student_account()));
GRANT SELECT ON public.enrollment_requests TO authenticated;
CREATE POLICY enrollment_requests_read ON public.enrollment_requests FOR SELECT TO authenticated USING (student_id = (SELECT auth.uid()) AND (SELECT aarohon_private.is_active_student_account()));
GRANT SELECT ON public.payments TO authenticated;
CREATE POLICY payments_read ON public.payments FOR SELECT TO authenticated USING (student_id = (SELECT auth.uid()) AND (SELECT aarohon_private.is_active_student_account()));
GRANT SELECT ON public.payment_items TO authenticated;
CREATE POLICY payment_items_read ON public.payment_items FOR SELECT TO authenticated USING (student_id = (SELECT auth.uid()) AND (SELECT aarohon_private.is_active_student_account()));
GRANT SELECT ON public.lesson_progress TO authenticated;
CREATE POLICY lesson_progress_read ON public.lesson_progress FOR SELECT TO authenticated USING (student_id = (SELECT auth.uid()) AND (SELECT aarohon_private.is_active_student_account()));
GRANT SELECT ON public.bookmarks TO authenticated;
CREATE POLICY bookmarks_read ON public.bookmarks FOR SELECT TO authenticated USING (student_id = (SELECT auth.uid()) AND (SELECT aarohon_private.is_active_student_account()));
GRANT SELECT ON public.question_reads TO authenticated;
CREATE POLICY question_reads_read ON public.question_reads FOR SELECT TO authenticated USING (student_id = (SELECT auth.uid()) AND (SELECT aarohon_private.is_active_student_account()));
GRANT SELECT ON public.mistake_reviews TO authenticated;
CREATE POLICY mistake_reviews_read ON public.mistake_reviews FOR SELECT TO authenticated USING (student_id = (SELECT auth.uid()) AND (SELECT aarohon_private.is_active_student_account()));
GRANT SELECT ON public.practice_sessions TO authenticated;
CREATE POLICY practice_sessions_read ON public.practice_sessions FOR SELECT TO authenticated USING (student_id = (SELECT auth.uid()) AND (SELECT aarohon_private.is_active_student_account()));
GRANT SELECT ON public.study_activity TO authenticated;
CREATE POLICY study_activity_read ON public.study_activity FOR SELECT TO authenticated USING (student_id = (SELECT auth.uid()) AND (SELECT aarohon_private.is_active_student_account()));
GRANT SELECT ON public.referral_codes TO authenticated;
CREATE POLICY referral_codes_read ON public.referral_codes FOR SELECT TO authenticated USING (student_id = (SELECT auth.uid()) AND (SELECT aarohon_private.is_active_student_account()));
GRANT SELECT ON public.exam_reminders TO authenticated;
CREATE POLICY exam_reminders_read ON public.exam_reminders FOR SELECT TO authenticated USING (student_id = (SELECT auth.uid()) AND (SELECT aarohon_private.is_active_student_account()));
GRANT SELECT ON public.news_reads TO authenticated;
CREATE POLICY news_reads_read ON public.news_reads FOR SELECT TO authenticated USING (student_id = (SELECT auth.uid()) AND (SELECT aarohon_private.is_active_student_account()));
GRANT SELECT ON public.notification_recipients TO authenticated;
CREATE POLICY notification_recipients_read ON public.notification_recipients FOR SELECT TO authenticated USING (student_id = (SELECT auth.uid()) AND (SELECT aarohon_private.is_active_student_account()));
GRANT SELECT ON public.exam_attempts TO authenticated;
CREATE POLICY exam_attempts_read ON public.exam_attempts FOR SELECT TO authenticated USING (student_id = (SELECT auth.uid()) AND (SELECT aarohon_private.is_active_student_account()) AND status IN ('submitted','expired') AND EXISTS(SELECT 1 FROM public.exams e WHERE e.id=exam_id AND (e.results_at IS NULL OR e.results_at<=now())));
GRANT SELECT ON public.notifications TO authenticated;
CREATE POLICY notifications_read ON public.notifications FOR SELECT TO authenticated USING ((SELECT aarohon_private.is_active_student_account()) AND EXISTS(SELECT 1 FROM public.notification_recipients r WHERE r.notification_id=notifications.id AND r.student_id=(SELECT auth.uid())));
GRANT SELECT ON public.referrals TO authenticated;
CREATE POLICY referrals_read ON public.referrals FOR SELECT TO authenticated USING ((SELECT aarohon_private.is_active_student_account()) AND (referred_student_id=(SELECT auth.uid()) OR EXISTS(SELECT 1 FROM public.referral_codes c WHERE c.id=referral_code_id AND c.student_id=(SELECT auth.uid()))));
GRANT SELECT ON public.referral_rewards TO authenticated;
CREATE POLICY referral_rewards_read ON public.referral_rewards FOR SELECT TO authenticated USING ((SELECT aarohon_private.is_active_student_account()) AND EXISTS(SELECT 1 FROM public.referrals r JOIN public.referral_codes c ON c.id=r.referral_code_id WHERE r.id=referral_id AND c.student_id=(SELECT auth.uid())));
GRANT UPDATE(read_at) ON public.notification_recipients TO authenticated;
CREATE POLICY notifications_mark_read ON public.notification_recipients FOR UPDATE TO authenticated
USING(student_id=(SELECT auth.uid()) AND (SELECT aarohon_private.is_active_student_account()))
WITH CHECK(student_id=(SELECT auth.uid()));

-- No browser grants for lessons, questions, options, answer keys, exam question lists,
-- attempt answers, practice answers, coupons, settings or audit logs.
-- Serve only authorized fields from your server; explanation may reveal the answer.
-- Admin/teacher mutations also use the server after role + account-status checks.
CREATE INDEX enrollments_lookup_1 ON public.enrollments (course_id);
CREATE INDEX lessons_lookup_1 ON public.lessons (topic_id);
CREATE INDEX enrollment_requests_lookup_1 ON public.enrollment_requests (student_id);
CREATE INDEX enrollment_requests_lookup_2 ON public.enrollment_requests (course_id);
CREATE INDEX payments_lookup_1 ON public.payments (student_id);
CREATE INDEX payment_items_lookup_1 ON public.payment_items (request_id);
CREATE INDEX payment_items_lookup_2 ON public.payment_items (enrollment_id);
CREATE INDEX questions_lookup_1 ON public.questions (topic_id);
CREATE INDEX question_options_lookup_1 ON public.question_options (question_id);
CREATE INDEX exam_questions_lookup_1 ON public.exam_questions (question_id);
CREATE INDEX exams_lookup_1 ON public.exams (course_id);
CREATE INDEX exams_lookup_2 ON public.exams (status, starts_at);
CREATE INDEX exam_attempts_lookup_1 ON public.exam_attempts (exam_id);
CREATE INDEX exam_attempts_lookup_2 ON public.exam_attempts (student_id, submitted_at);
CREATE INDEX attempt_answers_lookup_1 ON public.attempt_answers (exam_id, question_id);
CREATE INDEX practice_sessions_lookup_1 ON public.practice_sessions (student_id);
CREATE INDEX practice_sessions_lookup_2 ON public.practice_sessions (topic_id);
CREATE INDEX bookmarks_lookup_1 ON public.bookmarks (question_id);
CREATE INDEX mistake_reviews_lookup_1 ON public.mistake_reviews (question_id);
CREATE INDEX notification_recipients_lookup_1 ON public.notification_recipients (student_id);
CREATE INDEX referrals_lookup_1 ON public.referrals (referral_code_id);
CREATE INDEX news_reads_lookup_1 ON public.news_reads (student_id);
CREATE INDEX audit_logs_lookup_1 ON public.audit_logs (actor_id, created_at);
CREATE INDEX exam_reminders_lookup_1 ON public.exam_reminders (sent_at, remind_at);

CREATE UNIQUE INDEX one_pending_course_request ON public.enrollment_requests(student_id,course_id) WHERE status='pending';
CREATE UNIQUE INDEX one_active_exam_attempt ON public.exam_attempts(student_id,exam_id) WHERE status='in_progress';
CREATE UNIQUE INDEX unique_root_topic_name ON public.topics(subject_id,lower(name)) WHERE parent_id IS NULL;
CREATE UNIQUE INDEX unique_child_topic_name ON public.topics(parent_id,lower(name)) WHERE parent_id IS NOT NULL;

-- Setup version is a marker, never a client-editable setting.
INSERT INTO public.site_settings(key,value) VALUES('schema_version','{"version":1,"name":"aarohon-fresh"}');
COMMIT;
