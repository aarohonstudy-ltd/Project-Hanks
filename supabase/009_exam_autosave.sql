-- Run after 008. Then enable pg_cron and run 010_exam_cron.sql.
BEGIN;
ALTER TABLE public.exam_attempts ADD COLUMN IF NOT EXISTS write_token uuid NOT NULL DEFAULT gen_random_uuid();
ALTER TABLE public.exam_attempts ADD COLUMN IF NOT EXISTS focus_violations integer NOT NULL DEFAULT 0;
ALTER TABLE public.exam_attempts ADD COLUMN IF NOT EXISTS submission_reason text;
ALTER TABLE public.attempt_answers ADD COLUMN IF NOT EXISTS answer_revision bigint NOT NULL DEFAULT 0;
-- Early forced submission must not reveal a live score through direct table reads.
DROP POLICY IF EXISTS exam_attempts_read ON public.exam_attempts;
CREATE POLICY exam_attempts_read ON public.exam_attempts FOR SELECT TO authenticated
USING(student_id=(SELECT auth.uid()) AND (SELECT aarohon_private.is_active_student_account()) AND status IN ('submitted','expired') AND EXISTS(SELECT 1 FROM public.exams e WHERE e.id=exam_id AND now()>=coalesce(e.results_at,e.ends_at,'-infinity'::timestamptz)));
CREATE INDEX IF NOT EXISTS pending_exam_deadlines ON public.exam_attempts(deadline_at) WHERE status='in_progress';
CREATE TABLE IF NOT EXISTS public.exam_focus_events(
 attempt_id uuid NOT NULL REFERENCES public.exam_attempts(id),event_id uuid NOT NULL,
 kind text NOT NULL CHECK(kind IN ('hidden','blur','fullscreen_exit','pagehide')),
 received_at timestamptz NOT NULL DEFAULT clock_timestamp(),PRIMARY KEY(attempt_id,event_id)
);
ALTER TABLE public.exam_focus_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.exam_focus_events FROM PUBLIC,anon,authenticated;

CREATE OR REPLACE FUNCTION aarohon_private.finish_exam(aid uuid,reason text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE a public.exam_attempts%ROWTYPE; totals record; finished timestamptz;
BEGIN
 SELECT * INTO a FROM public.exam_attempts WHERE id=aid FOR UPDATE;
 IF NOT FOUND OR a.status<>'in_progress' THEN RETURN; END IF;
 finished:=CASE WHEN reason='deadline' THEN a.deadline_at ELSE least(clock_timestamp(),a.deadline_at) END;
 INSERT INTO public.attempt_answers(attempt_id,exam_id,question_id)
 SELECT a.id,a.exam_id,eq.question_id FROM public.exam_questions eq WHERE eq.exam_id=a.exam_id ON CONFLICT DO NOTHING;
 UPDATE public.attempt_answers aa SET
 is_correct=coalesce(aa.selected_option_id=k.correct_option_id,false),
 awarded_marks=CASE WHEN aa.selected_option_id IS NULL THEN 0 WHEN aa.selected_option_id=k.correct_option_id THEN eq.marks ELSE -eq.negative_marks END
 FROM public.exam_questions eq JOIN public.question_answer_keys k ON k.question_id=eq.question_id
 WHERE aa.attempt_id=aid AND eq.exam_id=a.exam_id AND eq.question_id=aa.question_id;
 SELECT coalesce(sum(awarded_marks),0) points,
 count(*) FILTER(WHERE selected_option_id IS NOT NULL AND is_correct)::int correct,
 count(*) FILTER(WHERE selected_option_id IS NOT NULL AND NOT is_correct)::int wrong,
 count(*) FILTER(WHERE selected_option_id IS NULL)::int skipped
 INTO totals FROM public.attempt_answers WHERE attempt_id=aid;
 UPDATE public.exam_attempts SET status='submitted',submitted_at=finished,submission_reason=reason,
 score=totals.points,correct_count=totals.correct,wrong_count=totals.wrong,skipped_count=totals.skipped WHERE id=aid;
 INSERT INTO public.study_activity(student_id,activity_date,questions_answered) VALUES(a.student_id,(finished AT TIME ZONE 'Asia/Dhaka')::date,totals.correct+totals.wrong)
 ON CONFLICT(student_id,activity_date) DO UPDATE SET questions_answered=public.study_activity.questions_answered+EXCLUDED.questions_answered;
 INSERT INTO public.audit_logs(actor_id,action,entity_type,entity_id) VALUES(a.student_id,'exam_submit:'||reason,'exam_attempt',aid::text);
END $$;

CREATE OR REPLACE FUNCTION aarohon_private.expire_exams() RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE r record; n int:=0; BEGIN
 PERFORM pg_advisory_xact_lock_shared(680006);
 FOR r IN SELECT id,student_id FROM public.exam_attempts WHERE status='in_progress' AND deadline_at<=clock_timestamp() ORDER BY deadline_at LIMIT 1000 LOOP
  -- Match student RPC lock order: profile, then attempt. Avoid FK/audit deadlocks.
  PERFORM 1 FROM public.profiles WHERE id=r.student_id FOR UPDATE SKIP LOCKED;
  IF NOT FOUND THEN CONTINUE; END IF;
  PERFORM 1 FROM public.exam_attempts WHERE id=r.id AND status='in_progress' AND deadline_at<=clock_timestamp() FOR UPDATE SKIP LOCKED;
  IF FOUND THEN PERFORM aarohon_private.finish_exam(r.id,'deadline');n:=n+1; END IF;
 END LOOP;
 RETURN n;
END $$;

CREATE OR REPLACE FUNCTION aarohon_private.exam_session(aid uuid) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT jsonb_build_object('attemptId',a.id,'examId',a.exam_id,'title',e.title,'practice',false,'isLive',e.exam_type='live',
 'deadline',a.deadline_at,'serverNow',clock_timestamp(),'writeToken',a.write_token,'warnings',a.focus_violations,
 'eventIds',coalesce((SELECT jsonb_agg(event_id) FROM public.exam_focus_events WHERE attempt_id=a.id),'[]'::jsonb),
 'answers',coalesce((SELECT jsonb_object_agg(aa.question_id,(SELECT count(*) FROM public.question_options op WHERE op.question_id=aa.question_id AND op.position<o.position)) FROM public.attempt_answers aa JOIN public.question_options o ON o.id=aa.selected_option_id WHERE aa.attempt_id=a.id),'{}'::jsonb),
 'revisions',coalesce((SELECT jsonb_object_agg(question_id,answer_revision) FROM public.attempt_answers WHERE attempt_id=a.id),'{}'::jsonb),
 'items',(SELECT jsonb_agg(aarohon_private.question_dto(eq.question_id,false) ORDER BY eq.position) FROM public.exam_questions eq WHERE eq.exam_id=a.exam_id))
 FROM public.exam_attempts a JOIN public.exams e ON e.id=a.exam_id WHERE a.id=aid
$$;

CREATE OR REPLACE FUNCTION public.aarohon_exam_action(action_name text,payload jsonb DEFAULT '{}'::jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE u uuid; a public.exam_attempts%ROWTYPE;e public.exams%ROWTYPE;r record;v jsonb;qid uuid;oid uuid;idx int;rev bigint;eid uuid;kind text;dt timestamptz;
BEGIN
 u:=aarohon_private.require_student();PERFORM pg_advisory_xact_lock_shared(680006);
 PERFORM 1 FROM public.profiles WHERE id=u FOR UPDATE;
 IF jsonb_typeof(payload) IS DISTINCT FROM 'object' OR octet_length(payload::text)>64000 THEN RAISE EXCEPTION 'Invalid exam request'; END IF;
 IF action_name IN ('start','resume') THEN
  -- Resolve overdue attempts before selecting an active session; never zero saved answers.
  FOR r IN SELECT id FROM public.exam_attempts WHERE student_id=u AND status='in_progress' AND deadline_at<=clock_timestamp() FOR UPDATE LOOP PERFORM aarohon_private.finish_exam(r.id,'deadline'); END LOOP;
  SELECT * INTO a FROM public.exam_attempts WHERE student_id=u AND status='in_progress' ORDER BY started_at DESC LIMIT 1 FOR UPDATE;
  IF FOUND THEN
   UPDATE public.exam_attempts SET write_token=gen_random_uuid() WHERE id=a.id;
   RETURN jsonb_build_object('session',aarohon_private.exam_session(a.id));
  END IF;
  IF action_name='resume' THEN RETURN jsonb_build_object('session',NULL,'data',public.aarohon_dashboard()); END IF;
  SELECT * INTO e FROM public.exams WHERE id=(payload->>'id')::uuid AND status='published' FOR SHARE;
  dt:=clock_timestamp();
  IF NOT FOUND OR (e.course_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.courses WHERE id=e.course_id AND status='published')) THEN RAISE EXCEPTION 'Exam unavailable'; END IF;
  IF e.starts_at>dt OR e.ends_at<=dt THEN RAISE EXCEPTION 'Exam is outside its scheduled time'; END IF;
  IF NOT e.is_free AND NOT aarohon_private.has_course(u,e.course_id) THEN RAISE EXCEPTION 'Course enrollment required'; END IF;
  IF e.exam_type='live' AND NOT coalesce((payload->>'consent')::boolean,false) THEN RAISE EXCEPTION 'Accept the live exam rules first'; END IF;
  IF e.exam_type='live' AND EXISTS(SELECT 1 FROM public.exam_attempts WHERE student_id=u AND exam_id=e.id) THEN RAISE EXCEPTION 'Live exam already attempted'; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.exam_questions WHERE exam_id=e.id) OR EXISTS(SELECT 1 FROM public.exam_questions eq WHERE eq.exam_id=e.id AND NOT EXISTS(SELECT 1 FROM public.question_answer_keys k WHERE k.question_id=eq.question_id)) THEN RAISE EXCEPTION 'Exam questions are not ready'; END IF;
  INSERT INTO public.exam_attempts(student_id,exam_id,attempt_number,started_at,deadline_at)
  SELECT u,e.id,coalesce(max(attempt_number),0)+1,dt,least(dt+make_interval(mins=>e.duration_minutes),coalesce(e.ends_at,'infinity'::timestamptz)) FROM public.exam_attempts WHERE student_id=u AND exam_id=e.id RETURNING * INTO a;
  RETURN jsonb_build_object('session',aarohon_private.exam_session(a.id));
 ELSIF action_name NOT IN ('sync','submit') THEN RAISE EXCEPTION 'Unknown exam action'; END IF;
 SELECT * INTO a FROM public.exam_attempts WHERE id=(payload->>'attemptId')::uuid AND student_id=u FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Attempt unavailable'; END IF;
 IF a.status='in_progress' AND a.deadline_at<=clock_timestamp() THEN PERFORM aarohon_private.finish_exam(a.id,'deadline');
 ELSIF a.status='in_progress' THEN
  IF a.write_token IS DISTINCT FROM nullif(payload->>'writeToken','')::uuid THEN RAISE EXCEPTION 'এই পরীক্ষা অন্য tab/device-এ খোলা হয়েছে। সেখানে চালিয়ে যান, অথবা পেজ reload করে Resume করুন।'; END IF;
  IF jsonb_typeof(coalesce(payload->'answers','{}'::jsonb))<>'object' OR jsonb_typeof(coalesce(payload->'events','[]'::jsonb))<>'array' OR jsonb_array_length(coalesce(payload->'events','[]'::jsonb))>2 THEN RAISE EXCEPTION 'Invalid answers/events'; END IF;
  FOR r IN SELECT key,value FROM jsonb_each(coalesce(payload->'answers','{}'::jsonb)) LOOP
   qid:=r.key::uuid;idx:=(r.value->>'index')::int;rev:=(r.value->>'revision')::bigint;
   IF idx IS NULL OR idx<0 OR idx>20 OR rev IS NULL OR rev NOT BETWEEN 1 AND 9007199254740991 OR NOT EXISTS(SELECT 1 FROM public.exam_questions WHERE exam_id=a.exam_id AND question_id=qid) THEN RAISE EXCEPTION 'Invalid answer'; END IF;
   SELECT id INTO oid FROM public.question_options WHERE question_id=qid ORDER BY position OFFSET idx LIMIT 1;
   IF oid IS NULL THEN RAISE EXCEPTION 'Invalid option'; END IF;
   INSERT INTO public.attempt_answers(attempt_id,exam_id,question_id,selected_option_id,answer_revision) VALUES(a.id,a.exam_id,qid,oid,rev)
   ON CONFLICT(attempt_id,question_id) DO UPDATE SET selected_option_id=EXCLUDED.selected_option_id,answer_revision=EXCLUDED.answer_revision
   WHERE public.attempt_answers.answer_revision<EXCLUDED.answer_revision;
  END LOOP;
  SELECT * INTO e FROM public.exams WHERE id=a.exam_id;
  IF e.exam_type='live' THEN
   FOR v IN SELECT value FROM jsonb_array_elements(coalesce(payload->'events','[]'::jsonb)) LOOP
    eid:=(v->>'id')::uuid;kind:=v->>'kind';
    IF eid IS NULL OR kind IS NULL OR kind NOT IN ('hidden','blur','fullscreen_exit','pagehide') THEN RAISE EXCEPTION 'Invalid focus event'; END IF;
    INSERT INTO public.exam_focus_events(attempt_id,event_id,kind) VALUES(a.id,eid,kind) ON CONFLICT DO NOTHING;
    IF FOUND THEN UPDATE public.exam_attempts SET focus_violations=focus_violations+1 WHERE id=a.id; END IF;
   END LOOP;
  END IF;
  SELECT * INTO a FROM public.exam_attempts WHERE id=a.id;
  IF a.focus_violations>=2 THEN PERFORM aarohon_private.finish_exam(a.id,'focus_limit');
  ELSIF action_name='submit' THEN PERFORM aarohon_private.finish_exam(a.id,'manual'); END IF;
 END IF;
 SELECT * INTO a FROM public.exam_attempts WHERE id=a.id;
 RETURN jsonb_build_object('status',a.status,'reason',a.submission_reason,'warnings',a.focus_violations,'deadline',a.deadline_at,'serverNow',clock_timestamp(),
 'revisions',coalesce((SELECT jsonb_object_agg(question_id,answer_revision) FROM public.attempt_answers WHERE attempt_id=a.id),'{}'::jsonb));
END $$;

-- Old clients cannot bypass autosave/focus enforcement by calling the earlier submit path.
CREATE OR REPLACE FUNCTION public.aarohon_student_action(action text,payload jsonb DEFAULT '{}'::jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ BEGIN
 PERFORM pg_advisory_xact_lock_shared(680006);
 IF action='refresh_dashboard' THEN RETURN jsonb_build_object('data',public.aarohon_dashboard()); END IF;
 IF action='start_practice' AND EXISTS(SELECT 1 FROM public.exam_attempts WHERE student_id=auth.uid() AND status='in_progress' AND deadline_at>clock_timestamp()) THEN RAISE EXCEPTION 'চলমান পরীক্ষাটি আগে জমা দিন।'; END IF;
 IF action='start' THEN RETURN public.aarohon_exam_action('start',payload); END IF;
 IF action='resume_exam' THEN RETURN public.aarohon_exam_action('resume',payload); END IF;
 IF action='submit' AND NOT coalesce((payload->>'practice')::boolean,false) THEN
  RAISE EXCEPTION 'পরীক্ষার নতুন autosave interface ব্যবহার করতে পেজ reload করুন।';
 END IF;
 RETURN public.aarohon_student_action_core(action,payload);
END $$;
REVOKE ALL ON FUNCTION aarohon_private.finish_exam(uuid,text),aarohon_private.expire_exams(),aarohon_private.exam_session(uuid) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.aarohon_exam_action(text,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.aarohon_exam_action(text,jsonb) TO authenticated;
CREATE OR REPLACE FUNCTION public.aarohon_admin_data(view_name text DEFAULT 'overview',search_text text DEFAULT '',page_number integer DEFAULT 1) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE u uuid:=aarohon_private.require_admin(); base text; result jsonb; total bigint; pg integer:=greatest(1,least(coalesce(page_number,1),100000)); pattern text:='%'||left(coalesce(search_text,''),200)||'%'; BEGIN
IF view_name='overview' THEN RETURN jsonb_build_object('rows','[]'::jsonb,'total',0,'page',1,'counts',jsonb_build_object(
 'students',(SELECT count(*) FROM public.profiles WHERE role='student'),
 'courses',(SELECT count(*) FROM public.courses WHERE status='published'),
 'questions',(SELECT count(*) FROM public.questions WHERE status='published'),
 'requests',(SELECT count(*) FROM public.enrollment_requests WHERE status='pending'),
 'exams',(SELECT count(*) FROM public.exams WHERE status='published'),
 'attempts',(SELECT count(*) FROM public.exam_attempts WHERE status='submitted'))); END IF;
CASE view_name
WHEN 'courses' THEN base:=$q$SELECT c.*,coalesce((SELECT jsonb_agg(subject_id) FROM public.course_subjects WHERE course_id=c.id),'[]'::jsonb) subject_ids,c.title search_value FROM public.courses c$q$;
WHEN 'subjects' THEN base:=$q$SELECT s.*,s.name search_value FROM public.subjects s$q$;
WHEN 'topics' THEN base:=$q$SELECT t.*,s.name subject_name,t.name||' '||s.name search_value FROM public.topics t JOIN public.subjects s ON s.id=t.subject_id$q$;
WHEN 'lessons' THEN base:=$q$SELECT l.*,c.title course_title,l.title||' '||c.title search_value FROM public.lessons l JOIN public.courses c ON c.id=l.course_id$q$;
WHEN 'questions' THEN base:=$q$SELECT q.*,t.name topic_name,
coalesce((SELECT jsonb_agg(o.option_text ORDER BY o.position) FROM public.question_options o WHERE o.question_id=q.id),'[]'::jsonb) options,
(SELECT count(*) FROM public.question_options o WHERE o.question_id=q.id AND o.position<(SELECT z.position FROM public.question_options z JOIN public.question_answer_keys k ON k.correct_option_id=z.id WHERE k.question_id=q.id)) correct_index,
(EXISTS(SELECT 1 FROM public.practice_answers p WHERE p.question_id=q.id) OR EXISTS(SELECT 1 FROM public.exam_questions eq JOIN public.exams e ON e.id=eq.exam_id WHERE eq.question_id=q.id AND (e.status='published' OR EXISTS(SELECT 1 FROM public.exam_attempts a WHERE a.exam_id=e.id)))) locked,
q.question_text||' '||t.name search_value FROM public.questions q JOIN public.topics t ON t.id=q.topic_id$q$;
WHEN 'exams' THEN base:=$q$SELECT e.*,c.title course_title,EXISTS(SELECT 1 FROM public.exam_attempts a WHERE a.exam_id=e.id) locked,
coalesce((SELECT jsonb_agg(jsonb_build_object('id',q.id,'title',q.question_text,'marks',eq.marks,'negative_marks',eq.negative_marks) ORDER BY eq.position) FROM public.exam_questions eq JOIN public.questions q ON q.id=eq.question_id WHERE eq.exam_id=e.id),'[]'::jsonb) items,
e.title search_value FROM public.exams e LEFT JOIN public.courses c ON c.id=e.course_id$q$;
WHEN 'requests' THEN base:=$q$SELECT r.*,p.full_name student_name,a.email,c.title course_title,r.status||' '||p.full_name||' '||a.email||' '||c.title search_value FROM public.enrollment_requests r JOIN public.profiles p ON p.id=r.student_id JOIN auth.users a ON a.id=p.id JOIN public.courses c ON c.id=r.course_id$q$;
WHEN 'students' THEN base:=$q$SELECT p.id,p.full_name,p.role,p.status,p.created_at,a.email,p.full_name||' '||a.email search_value FROM public.profiles p JOIN auth.users a ON a.id=p.id$q$;
WHEN 'results' THEN base:=$q$SELECT a.id,a.student_id,a.status,a.submission_reason,a.focus_violations,a.score,a.correct_count,a.wrong_count,a.skipped_count,a.started_at created_at,a.submitted_at,p.full_name student_name,e.title exam_title,p.full_name||' '||e.title search_value FROM public.exam_attempts a JOIN public.profiles p ON p.id=a.student_id JOIN public.exams e ON e.id=a.exam_id$q$;
WHEN 'audit' THEN base:=$q$SELECT a.*,p.full_name actor_name,a.action||' '||a.entity_type||' '||coalesce(p.full_name,'') search_value FROM public.audit_logs a LEFT JOIN public.profiles p ON p.id=a.actor_id$q$;
ELSE RAISE EXCEPTION 'Unknown admin section'; END CASE;
EXECUTE 'SELECT count(*) FROM ('||base||') t WHERE search_value ILIKE $1' INTO total USING pattern;
EXECUTE 'SELECT coalesce(jsonb_agg(to_jsonb(t)-''search_value''),''[]''::jsonb) FROM (SELECT * FROM ('||base||') s WHERE search_value ILIKE $1 ORDER BY created_at DESC,id LIMIT 25 OFFSET $2) t' INTO result USING pattern,(pg-1)*25;
RETURN jsonb_build_object('rows',result,'total',total,'page',pg);
END $$;

CREATE OR REPLACE FUNCTION public.aarohon_admin_options() RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
BEGIN PERFORM aarohon_private.require_admin();
RETURN jsonb_build_object(
'courses',coalesce((SELECT jsonb_agg(jsonb_build_object('id',id,'title',title) ORDER BY title) FROM public.courses),'[]'::jsonb),
'subjects',coalesce((SELECT jsonb_agg(jsonb_build_object('id',id,'title',name) ORDER BY name) FROM public.subjects),'[]'::jsonb),
 'topics',coalesce((SELECT jsonb_agg(jsonb_build_object('id',t.id,'title',s.name||' / '||t.name) ORDER BY s.name,t.name) FROM public.topics t JOIN public.subjects s ON s.id=t.subject_id),'[]'::jsonb)); END $$;


INSERT INTO public.site_settings(key,value) VALUES('exam_safety_runtime','{"version":1}') ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value;
COMMIT;
