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


CREATE OR REPLACE FUNCTION public.aarohon_student_action_core(action text,payload jsonb DEFAULT '{}'::jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE u uuid:=aarohon_private.require_student(); ident uuid; cid uuid; qid uuid; aid uuid; opt uuid;
e public.exams%ROWTYPE; a public.exam_attempts%ROWTYPE; l public.lessons%ROWTYPE;
r record; msg text:='সংরক্ষিত হয়েছে।'; idx integer; correct_n integer:=0; wrong_n integer:=0; skip_n integer:=0; points numeric:=0;
qids uuid[]; is_practice boolean:=false; already boolean:=false; deadline timestamptz; outjson jsonb;
BEGIN
-- Serialize mutations for one user: duplicate clicks cannot race attempts/enrollment.
PERFORM 1 FROM public.profiles WHERE id=u FOR UPDATE;
IF action='profile' THEN
 IF length(trim(coalesce(payload->>'name','')))=0 OR length(payload->>'name')>80 OR length(coalesce(payload->>'goal',''))>120 THEN RAISE EXCEPTION 'Invalid profile'; END IF;
 UPDATE public.profiles SET full_name=trim(payload->>'name'),preparation_goal=trim(payload->>'goal') WHERE id=u;
ELSIF action='bookmark' THEN
 qid:=(payload->>'id')::uuid;
 IF coalesce((payload->>'enabled')::boolean,false) THEN
  IF NOT aarohon_private.can_study(u,qid) THEN RAISE EXCEPTION 'Question access unavailable'; END IF;
  INSERT INTO public.bookmarks(student_id,question_id) VALUES(u,qid) ON CONFLICT DO NOTHING;
 ELSE DELETE FROM public.bookmarks WHERE student_id=u AND question_id=qid; END IF;
ELSIF action='reminder' THEN
 ident:=(payload->>'id')::uuid; SELECT * INTO e FROM public.exams WHERE id=ident AND status='published';
 IF NOT FOUND THEN RAISE EXCEPTION 'Exam unavailable'; END IF;
 IF coalesce((payload->>'enabled')::boolean,false) THEN
 IF e.starts_at IS NULL OR e.starts_at<=now() THEN RAISE EXCEPTION 'Exam is not upcoming'; END IF;
 INSERT INTO public.exam_reminders(student_id,exam_id,remind_at) VALUES(u,ident,greatest(now(),e.starts_at-interval '15 minutes')) ON CONFLICT DO NOTHING;
 ELSE DELETE FROM public.exam_reminders WHERE student_id=u AND exam_id=ident; END IF;
 msg:='রিমাইন্ডার সংরক্ষিত। Email/push পাঠানো এখনো চালু হয়নি।';
ELSIF action='enroll' THEN
 cid:=(payload->>'id')::uuid;
 SELECT coalesce(offer_price,price) AS cost INTO r FROM public.courses WHERE id=cid AND status='published';
 IF NOT FOUND THEN RAISE EXCEPTION 'Course unavailable'; END IF;
 IF r.cost=0 THEN
 INSERT INTO public.enrollments(student_id,course_id) VALUES(u,cid) ON CONFLICT(student_id,course_id) DO UPDATE SET status='active',expires_at=NULL;
 msg:='ফ্রি কোর্সে এনরোল হয়েছে।';
 ELSE
 IF NOT aarohon_private.has_course(u,cid) THEN INSERT INTO public.enrollment_requests(student_id,course_id) VALUES(u,cid) ON CONFLICT DO NOTHING; END IF;
 msg:='এনরোলমেন্টের অনুরোধ পাঠানো হয়েছে। Admin approval প্রয়োজন।'; END IF;
ELSIF action IN ('lesson','complete_lesson') THEN
 SELECT * INTO l FROM public.lessons WHERE id=(payload->>'id')::uuid AND status='published';
 IF NOT FOUND OR NOT EXISTS(SELECT 1 FROM public.courses WHERE id=l.course_id AND status='published') OR (NOT l.is_preview AND NOT aarohon_private.has_course(u,l.course_id)) THEN RAISE EXCEPTION 'Lesson access unavailable'; END IF;
 IF action='lesson' THEN RETURN jsonb_build_object('lesson',jsonb_build_object('id',l.id,'title',l.title,'content',l.content,'videoUrl',l.video_url)); END IF;
 IF NOT aarohon_private.has_course(u,l.course_id) THEN RAISE EXCEPTION 'Enroll to save progress'; END IF;
 INSERT INTO public.lesson_progress(student_id,lesson_id,completed_at) VALUES(u,l.id,now()) ON CONFLICT(student_id,lesson_id) DO UPDATE SET completed_at=coalesce(public.lesson_progress.completed_at,EXCLUDED.completed_at);
ELSIF action='read_notifications' THEN
 UPDATE public.notification_recipients SET read_at=coalesce(read_at,now()) WHERE student_id=u;
ELSIF action='referral_code' THEN
 INSERT INTO public.referral_codes(student_id,code) VALUES(u,'AR-'||replace(gen_random_uuid()::text,'-','')) ON CONFLICT(student_id) DO NOTHING;
ELSIF action IN ('start','start_practice') THEN
 is_practice:=action='start_practice';
 IF is_practice THEN
 SELECT array_agg(value::uuid) INTO qids FROM jsonb_array_elements_text(payload->'questions');
 IF coalesce(array_length(qids,1),0)=0 OR array_length(qids,1)>100 THEN RAISE EXCEPTION 'Select 1–100 questions'; END IF;
 FOR qid IN SELECT unnest(qids) LOOP IF NOT aarohon_private.can_study(u,qid) OR NOT EXISTS(SELECT 1 FROM public.question_answer_keys WHERE question_id=qid) THEN RAISE EXCEPTION 'Question access unavailable'; END IF; END LOOP;
 INSERT INTO public.practice_sessions(student_id) VALUES(u) RETURNING id INTO aid;
 INSERT INTO public.practice_answers(session_id,question_id,position) SELECT aid,x.q,x.n::int FROM unnest(qids) WITH ORDINALITY x(q,n);
 deadline:=NULL;
 ELSE
 ident:=(payload->>'id')::uuid; SELECT * INTO e FROM public.exams WHERE id=ident AND status='published' FOR SHARE;
 IF NOT FOUND OR (e.course_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.courses WHERE id=e.course_id AND status='published')) THEN RAISE EXCEPTION 'Exam unavailable'; END IF;
 IF (e.starts_at IS NOT NULL AND e.starts_at>now()) OR (e.ends_at IS NOT NULL AND e.ends_at<=now()) THEN RAISE EXCEPTION 'Exam is outside its scheduled time'; END IF;
 IF NOT e.is_free AND NOT aarohon_private.has_course(u,e.course_id) THEN RAISE EXCEPTION 'Course enrollment required'; END IF;
 SELECT array_agg(question_id ORDER BY position) INTO qids FROM public.exam_questions WHERE exam_id=e.id;
 IF coalesce(array_length(qids,1),0)=0 THEN RAISE EXCEPTION 'Exam has no questions'; END IF;
 IF EXISTS(SELECT 1 FROM unnest(qids) q WHERE NOT EXISTS(SELECT 1 FROM public.question_answer_keys k WHERE k.question_id=q)) THEN RAISE EXCEPTION 'Exam is not ready'; END IF;
 UPDATE public.exam_attempts SET status='expired',submitted_at=now(),score=0,skipped_count=array_length(qids,1) WHERE student_id=u AND exam_id=e.id AND status='in_progress' AND deadline_at<=now();
 SELECT * INTO a FROM public.exam_attempts WHERE student_id=u AND exam_id=e.id AND status='in_progress';
 IF FOUND THEN aid:=a.id; deadline:=a.deadline_at;
 ELSE
 IF e.exam_type='live' AND EXISTS(SELECT 1 FROM public.exam_attempts WHERE student_id=u AND exam_id=e.id) THEN RAISE EXCEPTION 'Live exam already attempted'; END IF;
 deadline:=least(now()+make_interval(mins=>e.duration_minutes),coalesce(e.ends_at,'infinity'::timestamptz));
 INSERT INTO public.exam_attempts(student_id,exam_id,attempt_number,deadline_at) SELECT u,e.id,coalesce(max(attempt_number),0)+1,deadline FROM public.exam_attempts WHERE student_id=u AND exam_id=e.id RETURNING id INTO aid;
 END IF;
 END IF;
 RETURN jsonb_build_object('session',jsonb_build_object('attemptId',aid,'practice',is_practice,'deadline',deadline,'serverNow',now(),
 'items',(SELECT jsonb_agg(aarohon_private.question_dto(x.q,false) ORDER BY x.n) FROM unnest(qids) WITH ORDINALITY x(q,n))));
ELSIF action='submit' THEN
 aid:=(payload->>'attemptId')::uuid; is_practice:=coalesce((payload->>'practice')::boolean,false);
 IF jsonb_typeof(payload->'answers') IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'Answers must be an object'; END IF;
 IF is_practice THEN
 SELECT status INTO r FROM public.practice_sessions WHERE id=aid AND student_id=u FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Attempt unavailable'; END IF;
 already:=r.status<>'in_progress';
 ELSE
 SELECT * INTO a FROM public.exam_attempts WHERE id=aid AND student_id=u FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Attempt unavailable'; END IF;
 already:=a.status<>'in_progress';
 IF NOT already AND now()>a.deadline_at THEN
 UPDATE public.exam_attempts SET status='expired',submitted_at=now(),score=0,skipped_count=(SELECT count(*) FROM public.exam_questions WHERE exam_id=a.exam_id) WHERE id=aid;
 already:=true; msg:='সময় শেষ হয়েছে। সময়সীমার পরে পাঠানো উত্তর গ্রহণ করা হয়নি।'; END IF;
 END IF;
 IF NOT already THEN
 FOR r IN SELECT eq.question_id,eq.marks,eq.negative_marks FROM public.exam_questions eq WHERE NOT is_practice AND eq.exam_id=a.exam_id
 UNION ALL SELECT pa.question_id,1::numeric,0::numeric FROM public.practice_answers pa WHERE is_practice AND pa.session_id=aid LOOP
 opt:=NULL; idx:=NULL;
 IF payload->'answers'->>r.question_id::text IS NOT NULL THEN
 idx:=(payload->'answers'->>r.question_id::text)::integer;
 IF idx<0 OR idx>20 THEN RAISE EXCEPTION 'Invalid answer option'; END IF;
 SELECT id INTO opt FROM public.question_options WHERE question_id=r.question_id ORDER BY position OFFSET idx LIMIT 1;
 IF opt IS NULL THEN RAISE EXCEPTION 'Invalid answer option'; END IF;
 END IF;
 IF is_practice THEN opt:=coalesce((SELECT selected_option_id FROM public.practice_answers WHERE session_id=aid AND question_id=r.question_id),opt); END IF;
 IF opt IS NULL THEN skip_n:=skip_n+1;
 ELSIF EXISTS(SELECT 1 FROM public.question_answer_keys WHERE question_id=r.question_id AND correct_option_id=opt) THEN correct_n:=correct_n+1; points:=points+r.marks;
 ELSE wrong_n:=wrong_n+1; points:=points-r.negative_marks; END IF;
 IF is_practice THEN UPDATE public.practice_answers SET selected_option_id=opt,is_correct=coalesce(opt=(SELECT correct_option_id FROM public.question_answer_keys WHERE question_id=r.question_id),false) WHERE session_id=aid AND question_id=r.question_id;
 ELSE INSERT INTO public.attempt_answers(attempt_id,exam_id,question_id,selected_option_id,is_correct,awarded_marks)
 VALUES(aid,a.exam_id,r.question_id,opt,coalesce(opt=(SELECT correct_option_id FROM public.question_answer_keys WHERE question_id=r.question_id),false),CASE WHEN opt IS NULL THEN 0 WHEN opt=(SELECT correct_option_id FROM public.question_answer_keys WHERE question_id=r.question_id) THEN r.marks ELSE -r.negative_marks END); END IF;
 END LOOP;
 IF is_practice THEN UPDATE public.practice_sessions SET status='completed',completed_at=now() WHERE id=aid;
 ELSE UPDATE public.exam_attempts SET status='submitted',submitted_at=now(),score=points,correct_count=correct_n,wrong_count=wrong_n,skipped_count=skip_n WHERE id=aid; END IF;
 INSERT INTO public.study_activity(student_id,activity_date,questions_answered) VALUES(u,(now() AT TIME ZONE 'Asia/Dhaka')::date,correct_n+wrong_n)
 ON CONFLICT(student_id,activity_date) DO UPDATE SET questions_answered=public.study_activity.questions_answered+EXCLUDED.questions_answered;
 msg:='পরীক্ষা জমা হয়েছে। প্রকাশের সময় হলে ফলাফল দেখা যাবে।';
 END IF;
ELSE RAISE EXCEPTION 'Unknown action'; END IF;
RETURN jsonb_build_object('data',public.aarohon_dashboard(),'message',msg,'attemptId',aid);
END $$;
REVOKE ALL ON FUNCTION public.aarohon_student_action_core(text,jsonb) FROM PUBLIC,anon,authenticated;
CREATE OR REPLACE FUNCTION public.aarohon_practice_answer(attempt_ident uuid,question_ident uuid,option_index integer) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE u uuid:=aarohon_private.require_student(); chosen uuid; saved uuid; answer jsonb;
BEGIN
PERFORM pg_advisory_xact_lock_shared(680006);
PERFORM 1 FROM public.profiles WHERE id=u FOR UPDATE;
PERFORM 1 FROM public.practice_sessions WHERE id=attempt_ident AND student_id=u AND status='in_progress' FOR UPDATE;
IF NOT FOUND OR NOT aarohon_private.can_study(u,question_ident) THEN RAISE EXCEPTION 'Practice question unavailable'; END IF;
SELECT selected_option_id INTO saved FROM public.practice_answers WHERE session_id=attempt_ident AND question_id=question_ident;
IF NOT FOUND THEN RAISE EXCEPTION 'Question is not in this practice session'; END IF;
IF option_index IS NULL OR option_index<0 OR option_index>20 THEN RAISE EXCEPTION 'Invalid option'; END IF;
SELECT id INTO chosen FROM public.question_options WHERE question_id=question_ident ORDER BY position OFFSET option_index LIMIT 1;
IF chosen IS NULL THEN RAISE EXCEPTION 'Invalid option'; END IF;
chosen:=coalesce(saved,chosen);
UPDATE public.practice_answers SET selected_option_id=chosen,is_correct=chosen=(SELECT correct_option_id FROM public.question_answer_keys WHERE question_id=question_ident)
WHERE session_id=attempt_ident AND question_id=question_ident;
answer:=aarohon_private.question_dto(question_ident,true);
RETURN jsonb_build_object('answer',answer->'answer','explanation',answer->'explanation','selected',(SELECT count(*) FROM public.question_options WHERE question_id=question_ident AND position<(SELECT position FROM public.question_options WHERE id=chosen)));
END $$;
REVOKE ALL ON FUNCTION public.aarohon_practice_answer(uuid,uuid,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.aarohon_practice_answer(uuid,uuid,integer) TO authenticated;
COMMIT;
