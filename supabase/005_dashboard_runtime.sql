-- Additive runtime for the fresh Aarohon schema (001_setup.sql).
-- Run in your NEW project. Repeatable; does not reset content or users.
BEGIN;
CREATE OR REPLACE FUNCTION aarohon_private.require_student() RETURNS uuid
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE u uuid := auth.uid(); BEGIN
IF u IS NULL THEN RAISE EXCEPTION 'Login required'; END IF;
IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=u AND status='active') THEN RAISE EXCEPTION 'Account unavailable'; END IF;
RETURN u; END $$;
CREATE OR REPLACE FUNCTION aarohon_private.has_course(u uuid,c uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
SELECT EXISTS(SELECT 1 FROM public.enrollments WHERE student_id=u AND course_id=c AND status='active' AND (expires_at IS NULL OR expires_at>now())) $$;
CREATE OR REPLACE FUNCTION aarohon_private.question_released(q uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
SELECT NOT EXISTS(SELECT 1 FROM public.exam_questions eq JOIN public.exams e ON e.id=eq.exam_id
WHERE eq.question_id=q AND e.status='published' AND
(e.exam_type='live' OR e.starts_at IS NOT NULL OR e.answers_at IS NOT NULL) AND
now()<greatest(coalesce(e.ends_at,e.starts_at,'-infinity'::timestamptz),coalesce(e.answers_at,'-infinity'::timestamptz))) $$;
CREATE OR REPLACE FUNCTION aarohon_private.can_study(u uuid,q uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
SELECT EXISTS(SELECT 1 FROM public.questions x JOIN public.topics t ON t.id=x.topic_id
WHERE x.id=q AND x.status='published' AND aarohon_private.question_released(x.id)
AND (EXISTS(SELECT 1 FROM public.course_subjects cs JOIN public.courses c ON c.id=cs.course_id
WHERE cs.subject_id=t.subject_id AND c.status='published' AND aarohon_private.has_course(u,c.id))
OR EXISTS(SELECT 1 FROM public.exam_questions eq JOIN public.exams e ON e.id=eq.exam_id WHERE eq.question_id=x.id AND e.is_free AND e.status='published')))
$$;
CREATE OR REPLACE FUNCTION aarohon_private.question_dto(q uuid, reveal boolean) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
SELECT jsonb_build_object('id',x.id,'subject',s.name,'text',x.question_text,
'options',coalesce((SELECT jsonb_agg(o.option_text ORDER BY o.position) FROM public.question_options o WHERE o.question_id=x.id),'[]'::jsonb),
'optionIds',coalesce((SELECT jsonb_agg(o.id ORDER BY o.position) FROM public.question_options o WHERE o.question_id=x.id),'[]'::jsonb),
'answer',CASE WHEN reveal THEN coalesce((SELECT count(*)::int FROM public.question_options o WHERE o.question_id=x.id AND o.position<(SELECT z.position FROM public.question_options z JOIN public.question_answer_keys k ON k.correct_option_id=z.id WHERE k.question_id=x.id)),-1) ELSE -1 END,
'explanation',CASE WHEN reveal THEN x.explanation ELSE '' END)
FROM public.questions x JOIN public.topics t ON t.id=x.topic_id JOIN public.subjects s ON s.id=t.subject_id WHERE x.id=q $$;

CREATE OR REPLACE FUNCTION public.aarohon_dashboard() RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE u uuid:=aarohon_private.require_student(); result jsonb; BEGIN
SELECT jsonb_build_object(
'profile',(SELECT jsonb_build_object('id',p.id,'name',p.full_name,'email',a.email,'goal',coalesce(p.preparation_goal,'')) FROM public.profiles p JOIN auth.users a ON a.id=p.id WHERE p.id=u),
'courses',coalesce((SELECT jsonb_agg(jsonb_build_object('id',c.id,'title',c.title,'description',c.description,'category','আরোহণ','color','cyan',
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
'questions',coalesce((SELECT jsonb_agg(aarohon_private.question_dto(q.id,true) ORDER BY q.created_at) FROM public.questions q WHERE EXISTS(SELECT 1 FROM public.question_answer_keys k WHERE k.question_id=q.id) AND (aarohon_private.can_study(u,q.id) OR
(aarohon_private.question_released(q.id) AND EXISTS(SELECT 1 FROM public.attempt_answers aa JOIN public.exam_attempts a ON a.id=aa.attempt_id JOIN public.exams e ON e.id=a.exam_id WHERE a.student_id=u AND aa.question_id=q.id AND a.status IN ('submitted','expired') AND now()>=coalesce(e.results_at,e.ends_at,'-infinity'::timestamptz))))),'[]'::jsonb),
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
'notifications',coalesce((SELECT jsonb_agg(jsonb_build_object('id',n.id,'title',n.title,'body',n.body,'read',r.read_at IS NOT NULL) ORDER BY n.created_at DESC) FROM public.notifications n JOIN public.notification_recipients r ON r.notification_id=n.id WHERE r.student_id=u),'[]'::jsonb),
'referralCode',(SELECT code FROM public.referral_codes WHERE student_id=u AND is_active),
'referralCount',(SELECT count(*) FROM public.referrals r JOIN public.referral_codes c ON c.id=r.referral_code_id WHERE c.student_id=u),
'leaderboard',coalesce((SELECT jsonb_agg(jsonb_build_object('name',z.name,'score',z.score)) FROM (
SELECT CASE WHEN a.student_id=u THEN 'আপনি' ELSE 'শিক্ষার্থী '||left(a.student_id::text,8) END name,sum(a.score) score
FROM public.exam_attempts a JOIN public.exams e ON e.id=a.exam_id WHERE e.exam_type='live' AND e.status='published' AND a.status='submitted' AND now()>=greatest(coalesce(e.results_at,'-infinity'::timestamptz),coalesce(e.ends_at,'-infinity'::timestamptz))
GROUP BY a.student_id ORDER BY sum(a.score) DESC LIMIT 20) z),'[]'::jsonb)
) INTO result; RETURN result; END $$;

CREATE OR REPLACE FUNCTION public.aarohon_student_action(action text,payload jsonb DEFAULT '{}'::jsonb) RETURNS jsonb
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
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA aarohon_private FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION aarohon_private.is_active_student_account() TO authenticated;
REVOKE ALL ON FUNCTION public.aarohon_dashboard() FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.aarohon_student_action(text,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.aarohon_dashboard() TO authenticated;
GRANT EXECUTE ON FUNCTION public.aarohon_student_action(text,jsonb) TO authenticated;
DROP POLICY IF EXISTS exam_attempts_read ON public.exam_attempts;
CREATE POLICY exam_attempts_read ON public.exam_attempts FOR SELECT TO authenticated USING (student_id=(SELECT auth.uid()) AND (SELECT aarohon_private.is_active_student_account()) AND status IN ('submitted','expired') AND EXISTS(SELECT 1 FROM public.exams e WHERE e.id=exam_id AND now()>=coalesce(e.results_at,e.ends_at,'-infinity'::timestamptz)));
INSERT INTO public.site_settings(key,value) VALUES('dashboard_runtime','{"version":1}') ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value;
COMMIT;
