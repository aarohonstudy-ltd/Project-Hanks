-- Run AFTER 014. Repeatable. No content reset.
BEGIN;
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
  IF action_name='resume' THEN RETURN jsonb_build_object('session',NULL); END IF;
  SELECT * INTO e FROM public.exams WHERE id=(payload->>'id')::uuid AND status='published' FOR SHARE;
  dt:=clock_timestamp();
  IF NOT FOUND OR (e.course_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.courses WHERE id=e.course_id AND status='published')) THEN RAISE EXCEPTION 'Exam unavailable'; END IF;
  IF e.starts_at>dt OR e.ends_at<=dt THEN RAISE EXCEPTION 'Exam is outside its scheduled time'; END IF;
  IF aarohon_private.session_expires_at() <= least(dt+make_interval(mins=>e.duration_minutes),coalesce(e.ends_at,'infinity'::timestamptz))+interval '5 minutes' THEN
   RAISE EXCEPTION 'পরীক্ষা শেষ করার মতো session সময় নেই। Logout করে আবার login করুন, তারপর পরীক্ষা শুরু করুন।';
  END IF;
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
  SELECT * INTO e FROM public.exams WHERE id=a.exam_id;
  FOR r IN SELECT key,value FROM jsonb_each(coalesce(payload->'answers','{}'::jsonb)) LOOP
   qid:=r.key::uuid;idx:=(r.value->>'index')::int;rev:=(r.value->>'revision')::bigint;
   IF idx IS NULL OR idx<0 OR idx>20 OR rev IS NULL OR rev NOT BETWEEN 1 AND 9007199254740991 OR NOT EXISTS(SELECT 1 FROM public.exam_questions WHERE exam_id=a.exam_id AND question_id=qid) THEN RAISE EXCEPTION 'Invalid answer'; END IF;
   SELECT id INTO oid FROM public.question_options WHERE question_id=qid ORDER BY position OFFSET idx LIMIT 1;
   IF oid IS NULL THEN RAISE EXCEPTION 'Invalid option'; END IF;
   INSERT INTO public.attempt_answers(attempt_id,exam_id,question_id,selected_option_id,answer_revision) VALUES(a.id,a.exam_id,qid,oid,rev)
   ON CONFLICT(attempt_id,question_id) DO UPDATE SET selected_option_id=EXCLUDED.selected_option_id,answer_revision=EXCLUDED.answer_revision
   WHERE public.attempt_answers.answer_revision<EXCLUDED.answer_revision AND (e.exam_type<>'live' OR public.attempt_answers.selected_option_id IS NULL);
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
 'answers',coalesce((SELECT jsonb_object_agg(aa.question_id,(SELECT count(*) FROM public.question_options op WHERE op.question_id=aa.question_id AND op.position<o.position)) FROM public.attempt_answers aa JOIN public.question_options o ON o.id=aa.selected_option_id WHERE aa.attempt_id=a.id),'{}'::jsonb),
 'revisions',coalesce((SELECT jsonb_object_agg(question_id,answer_revision) FROM public.attempt_answers WHERE attempt_id=a.id),'{}'::jsonb));
END $$;
CREATE OR REPLACE FUNCTION public.aarohon_dashboard() RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE u uuid:=aarohon_private.require_student(); result jsonb; BEGIN
SELECT jsonb_build_object(
'profile',(SELECT jsonb_build_object('id',p.id,'role',p.role,'name',p.full_name,'email',a.email,'goal',coalesce(p.preparation_goal,'')) FROM public.profiles p JOIN auth.users a ON a.id=p.id WHERE p.id=u),
'courses',coalesce((SELECT jsonb_agg(jsonb_build_object('id',c.id,'title',c.title,'description',c.description,'thumbnail_url',c.thumbnail_url,'category','আরোহণ','color','cyan',
'price',coalesce(c.offer_price,c.price),'enrolled',aarohon_private.has_course(u,c.id),
'pending',EXISTS(SELECT 1 FROM public.enrollment_requests r WHERE r.student_id=u AND r.course_id=c.id AND r.status='pending'),
'lessons',coalesce((SELECT jsonb_agg(l.title ORDER BY l.position) FROM public.lessons l WHERE l.course_id=c.id AND l.status='published'),'[]'::jsonb),
'lessonIds',coalesce((SELECT jsonb_agg(l.id ORDER BY l.position) FROM public.lessons l WHERE l.course_id=c.id AND l.status='published'),'[]'::jsonb),
'completed',(SELECT count(*) FROM public.lesson_progress lp JOIN public.lessons l ON l.id=lp.lesson_id WHERE lp.student_id=u AND l.course_id=c.id AND l.status='published' AND lp.completed_at IS NOT NULL)
) ORDER BY c.created_at) FROM public.courses c WHERE c.status='published'),'[]'::jsonb),
'exams',coalesce((SELECT jsonb_agg(jsonb_build_object('id',e.id,'title',e.title,'subject',coalesce(c.title,'সাধারণ পরীক্ষা'),
'kind',CASE WHEN e.starts_at>now() THEN 'upcoming' WHEN e.exam_type='live' THEN 'live' ELSE 'free' END,
'isFree',e.is_free,'closed',e.ends_at IS NOT NULL AND e.ends_at<=now(),'date',coalesce(to_char(e.starts_at AT TIME ZONE 'Asia/Dhaka','DD Mon YYYY HH24:MI'),'যেকোনো সময়'),
'questions',coalesce((SELECT jsonb_agg(eq.question_id ORDER BY eq.position) FROM public.exam_questions eq WHERE eq.exam_id=e.id),'[]'::jsonb)
) ORDER BY e.created_at DESC) FROM public.exams e LEFT JOIN public.courses c ON c.id=e.course_id WHERE e.status='published' AND (c.id IS NULL OR c.status='published')),'[]'::jsonb),
'questions','[]'::jsonb,
'session',public.aarohon_session_status(),
'attempts',coalesce((SELECT jsonb_agg(x.item ORDER BY x.dt) FROM (
SELECT a.submitted_at dt,jsonb_build_object('id',a.id,'examId',a.exam_id,'title',e.title,'score',a.correct_count,'marks',a.score,
'answers',coalesce((SELECT jsonb_object_agg(aa.question_id,CASE WHEN aa.selected_option_id IS NULL THEN -1 ELSE (SELECT count(*) FROM public.question_options o WHERE o.question_id=aa.question_id AND o.position<(SELECT op.position FROM public.question_options op WHERE op.id=aa.selected_option_id)) END) FROM public.attempt_answers aa WHERE aa.attempt_id=a.id),'{}'::jsonb),
'questionIds',coalesce((SELECT jsonb_agg(eq.question_id ORDER BY eq.position) FROM public.exam_questions eq WHERE eq.exam_id=a.exam_id),'[]'::jsonb),
'total',(SELECT count(*) FROM public.exam_questions eq WHERE eq.exam_id=a.exam_id),'date',to_char(a.submitted_at AT TIME ZONE 'Asia/Dhaka','DD/MM/YYYY')) item
FROM public.exam_attempts a JOIN public.exams e ON e.id=a.exam_id WHERE a.student_id=u AND a.status IN ('submitted','expired') AND now()>=coalesce(e.results_at,e.ends_at,'-infinity'::timestamptz)
UNION ALL
SELECT p.completed_at,jsonb_build_object('id',p.id,'examId','practice','title','প্র্যাকটিস','score',(SELECT count(*) FROM public.practice_answers a WHERE a.session_id=p.id AND a.is_correct),
'answers',coalesce((SELECT jsonb_object_agg(a.question_id,CASE WHEN a.selected_option_id IS NULL THEN -1 ELSE (SELECT count(*) FROM public.question_options o WHERE o.question_id=a.question_id AND o.position<(SELECT op.position FROM public.question_options op WHERE op.id=a.selected_option_id)) END) FROM public.practice_answers a WHERE a.session_id=p.id),'{}'::jsonb),
'questionIds',coalesce((SELECT jsonb_agg(a.question_id ORDER BY a.position) FROM public.practice_answers a WHERE a.session_id=p.id),'[]'::jsonb),
 'total',(SELECT count(*) FROM public.practice_answers a WHERE a.session_id=p.id),'date',to_char(p.completed_at AT TIME ZONE 'Asia/Dhaka','DD/MM/YYYY'))
FROM public.practice_sessions p WHERE p.student_id=u AND p.status='completed'
) x),'[]'::jsonb),
'bookmarks',coalesce((SELECT jsonb_agg(question_id) FROM public.bookmarks WHERE student_id=u),'[]'::jsonb),
'reminders',coalesce((SELECT jsonb_agg(exam_id) FROM public.exam_reminders WHERE student_id=u),'[]'::jsonb),
'completedLessonIds',coalesce((SELECT jsonb_agg(lesson_id) FROM public.lesson_progress WHERE student_id=u AND completed_at IS NOT NULL),'[]'::jsonb),
'notifications',coalesce((SELECT jsonb_agg(jsonb_build_object('id',n.id,'title',n.title,'body',n.body,'url',n.action_url,'read',r.read_at IS NOT NULL) ORDER BY n.created_at DESC) FROM public.notifications n JOIN public.notification_recipients r ON r.notification_id=n.id WHERE r.student_id=u),'[]'::jsonb),
'referralCode',(SELECT code FROM public.referral_codes WHERE student_id=u AND is_active),
'referralCount',(SELECT count(*) FROM public.referrals r JOIN public.referral_codes c ON c.id=r.referral_code_id WHERE c.student_id=u),
'leaderboard','[]'::jsonb
) INTO result; RETURN result; END $$;
-- Only eligible question IDs are considered; no unreleased live answer is exposed.
CREATE OR REPLACE FUNCTION aarohon_private.study_questions(u uuid) RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
 SELECT q.id FROM public.questions q WHERE EXISTS(SELECT 1 FROM public.question_answer_keys k WHERE k.question_id=q.id)
 AND (aarohon_private.can_study(u,q.id) OR (aarohon_private.question_released(q.id) AND EXISTS(
 SELECT 1 FROM public.attempt_answers aa JOIN public.exam_attempts a ON a.id=aa.attempt_id JOIN public.exams e ON e.id=a.exam_id
 WHERE a.student_id=u AND aa.question_id=q.id AND a.status IN ('submitted','expired') AND now()>=coalesce(e.results_at,e.ends_at,'-infinity'::timestamptz))))
$$;
REVOKE ALL ON FUNCTION aarohon_private.study_questions(uuid) FROM PUBLIC,anon,authenticated;
CREATE OR REPLACE FUNCTION public.aarohon_questions(mode text DEFAULT 'questions',search_text text DEFAULT '',subject_name text DEFAULT '',page_number integer DEFAULT 1,question_ids uuid[] DEFAULT '{}') RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE u uuid:=aarohon_private.require_student(); result jsonb; pg int:=greatest(1,least(coalesce(page_number,1),100000)); BEGIN
 IF mode NOT IN ('questions','practice','bookmarks','mistakes','review') OR cardinality(question_ids)>5000 THEN RAISE EXCEPTION 'Invalid question request'; END IF;
 WITH eligible AS MATERIALIZED (
 SELECT q.id,q.question_text,q.created_at,s.name subject FROM aarohon_private.study_questions(u) ids(id)
 JOIN public.questions q ON q.id=ids.id JOIN public.topics t ON t.id=q.topic_id JOIN public.subjects s ON s.id=t.subject_id
 WHERE (mode NOT IN ('bookmarks','review','mistakes') OR
 (mode='bookmarks' AND EXISTS(SELECT 1 FROM public.bookmarks b WHERE b.student_id=u AND b.question_id=q.id)) OR
 (mode='review' AND q.id=ANY(question_ids)) OR
 (mode='mistakes' AND (EXISTS(SELECT 1 FROM public.practice_answers pa JOIN public.practice_sessions ps ON ps.id=pa.session_id WHERE ps.student_id=u AND ps.status='completed' AND pa.question_id=q.id AND NOT coalesce(pa.is_correct,false)) OR
 EXISTS(SELECT 1 FROM public.exam_questions eq JOIN public.exam_attempts a ON a.exam_id=eq.exam_id JOIN public.exams e ON e.id=a.exam_id LEFT JOIN public.attempt_answers aa ON aa.attempt_id=a.id AND aa.question_id=eq.question_id
 WHERE a.student_id=u AND eq.question_id=q.id AND a.status IN ('submitted','expired') AND now()>=coalesce(e.results_at,e.ends_at,'-infinity'::timestamptz) AND NOT coalesce(aa.is_correct,false)))))
 ), filtered AS MATERIALIZED (SELECT * FROM eligible WHERE (coalesce(subject_name,'')='' OR subject=subject_name) AND position(lower(left(coalesce(search_text,''),200)) IN lower(question_text))>0),
 page_rows AS (SELECT * FROM filtered ORDER BY created_at,id LIMIT 20 OFFSET (pg-1)*20)
 SELECT jsonb_build_object('rows',coalesce((SELECT jsonb_agg(aarohon_private.question_dto(id,true) ORDER BY created_at,id) FROM page_rows),'[]'::jsonb),
 'total',(SELECT count(*) FROM filtered),'page',pg,'subjects',coalesce((SELECT jsonb_agg(subject ORDER BY subject) FROM (SELECT DISTINCT subject FROM eligible) s),'[]'::jsonb)) INTO result;
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.aarohon_questions(text,text,text,integer,uuid[]) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.aarohon_questions(text,text,text,integer,uuid[]) TO authenticated;
CREATE OR REPLACE FUNCTION public.aarohon_subject_stats() RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE u uuid:=aarohon_private.require_student(); result jsonb; BEGIN
 WITH responses AS (
 SELECT eq.question_id,coalesce(aa.is_correct,false) correct FROM public.exam_attempts a JOIN public.exams e ON e.id=a.exam_id JOIN public.exam_questions eq ON eq.exam_id=e.id
 LEFT JOIN public.attempt_answers aa ON aa.attempt_id=a.id AND aa.question_id=eq.question_id
 WHERE a.student_id=u AND a.status IN ('submitted','expired') AND now()>=coalesce(e.results_at,e.ends_at,'-infinity'::timestamptz)
 UNION ALL SELECT pa.question_id,coalesce(pa.is_correct,false) FROM public.practice_sessions ps JOIN public.practice_answers pa ON pa.session_id=ps.id WHERE ps.student_id=u AND ps.status='completed'
 ), stats AS (SELECT s.name subject,count(*) total,count(*) FILTER(WHERE r.correct) correct FROM responses r
 JOIN aarohon_private.study_questions(u) ids(id) ON ids.id=r.question_id JOIN public.questions q ON q.id=r.question_id JOIN public.topics t ON t.id=q.topic_id JOIN public.subjects s ON s.id=t.subject_id GROUP BY s.name)
 SELECT coalesce(jsonb_agg(to_jsonb(stats) ORDER BY subject),'[]'::jsonb) INTO result FROM stats; RETURN result;
END $$;
REVOKE ALL ON FUNCTION public.aarohon_subject_stats() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.aarohon_subject_stats() TO authenticated;
COMMIT;
