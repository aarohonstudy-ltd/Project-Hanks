-- Run after 006. Read-only leaderboard API; additive and repeatable.
BEGIN;
CREATE OR REPLACE FUNCTION public.aarohon_exam_leaderboard(exam_id uuid DEFAULT NULL,search_text text DEFAULT '',page_number integer DEFAULT 1) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE u uuid:=aarohon_private.require_student(); catalog jsonb; selected uuid; meta jsonb; result jsonb; pg integer:=greatest(1,least(coalesce(page_number,1),100000)); BEGIN
SELECT coalesce(jsonb_agg(jsonb_build_object('id',e.id,'title',e.title,'courseId',e.course_id,'course',coalesce(c.title,'সাধারণ পরীক্ষা'),'type',e.exam_type,
'subjects',coalesce((SELECT string_agg(DISTINCT s.name,', ' ORDER BY s.name) FROM public.exam_questions eq JOIN public.questions q ON q.id=eq.question_id JOIN public.topics t ON t.id=q.topic_id JOIN public.subjects s ON s.id=t.subject_id WHERE eq.exam_id=e.id),'')) ORDER BY e.created_at DESC,e.id),'[]'::jsonb) INTO catalog
FROM public.exams e LEFT JOIN public.courses c ON c.id=e.course_id WHERE e.status='published' AND (e.course_id IS NULL OR c.status='published')
AND now()>=greatest(coalesce(e.ends_at,'-infinity'::timestamptz),coalesce(e.results_at,'-infinity'::timestamptz),coalesce(e.starts_at,'-infinity'::timestamptz))
AND (e.is_free OR aarohon_private.has_course(u,e.course_id) OR EXISTS(SELECT 1 FROM public.profiles WHERE id=u AND role='admin'));
selected:=coalesce(exam_id,(catalog->0->>'id')::uuid);
IF selected IS NULL THEN RETURN jsonb_build_object('exams',catalog,'exam',NULL,'rows','[]'::jsonb,'top','[]'::jsonb,'mine',NULL,'participants',0,'total',0,'page',pg,'passed',0); END IF;
IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(catalog) x WHERE x->>'id'=selected::text) THEN RAISE EXCEPTION 'Leaderboard unavailable or results are not published yet'; END IF;
SELECT jsonb_build_object('id',e.id,'title',e.title,'course',coalesce(c.title,'সাধারণ পরীক্ষা'),'passMark',e.pass_mark,'maxMarks',coalesce((SELECT sum(marks) FROM public.exam_questions WHERE public.exam_questions.exam_id=e.id),0),'duration',e.duration_minutes,'type',e.exam_type) INTO meta FROM public.exams e LEFT JOIN public.courses c ON c.id=e.course_id WHERE e.id=selected;
WITH best AS (
 SELECT DISTINCT ON (a.student_id) a.student_id,coalesce(nullif(trim(p.full_name),''),'শিক্ষার্থী') name,a.score,
 floor(greatest(0,extract(epoch FROM (a.submitted_at-a.started_at))))::integer seconds
 FROM public.exam_attempts a JOIN public.profiles p ON p.id=a.student_id
 WHERE a.exam_id=selected AND a.status='submitted' AND a.score IS NOT NULL AND a.submitted_at IS NOT NULL AND p.status='active'
 ORDER BY a.student_id,a.score DESC,(a.submitted_at-a.started_at),a.id
), ranked AS (
 SELECT *,rank() OVER(ORDER BY score DESC,seconds ASC) rank,student_id=u is_me FROM best
), shaped AS (
 SELECT *,jsonb_build_object('rank',rank,'name',name,'score',score,'seconds',seconds,'isMe',is_me,'passed',CASE WHEN (meta->>'passMark')::numeric>0 THEN score>=(meta->>'passMark')::numeric ELSE NULL END) item FROM ranked
), filtered AS (
 SELECT * FROM shaped WHERE name ILIKE '%'||left(coalesce(search_text,''),120)||'%'
)
SELECT jsonb_build_object('exams',catalog,'exam',meta,
'rows',coalesce((SELECT jsonb_agg(x.item ORDER BY x.rank,x.name,x.student_id) FROM (SELECT * FROM filtered ORDER BY rank,name,student_id LIMIT 25 OFFSET (pg-1)*25) x),'[]'::jsonb),
'top',coalesce((SELECT jsonb_agg(x.item ORDER BY x.rank,x.name,x.student_id) FROM (SELECT * FROM shaped ORDER BY rank,name,student_id LIMIT 3) x),'[]'::jsonb),
'mine',(SELECT item FROM shaped WHERE is_me),'participants',(SELECT count(*) FROM shaped),'total',(SELECT count(*) FROM filtered),'page',pg,
'passed',CASE WHEN (meta->>'passMark')::numeric>0 THEN (SELECT count(*) FROM shaped WHERE score>=(meta->>'passMark')::numeric) ELSE NULL END) INTO result;
RETURN result;END $$;
REVOKE ALL ON FUNCTION public.aarohon_exam_leaderboard(uuid,text,integer) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.aarohon_exam_leaderboard(uuid,text,integer) TO authenticated;

-- Extend the existing atomic exam editor with pass_mark.
CREATE OR REPLACE FUNCTION public.aarohon_admin_save(action_name text,payload jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE u uuid; ident uuid:=nullif(payload->>'id','')::uuid; existed boolean:=ident IS NOT NULL; txt text; st text; opt uuid; idx int; i int; r record; req public.enrollment_requests%ROWTYPE; ent text; c uuid; q uuid;
BEGIN
-- Serializes content edits against student transactions (wrapper below).
PERFORM pg_advisory_xact_lock(680006);
u:=aarohon_private.require_admin();
IF jsonb_typeof(payload) IS DISTINCT FROM 'object' THEN RAISE EXCEPTION 'Invalid input'; END IF;
IF ident IS NULL THEN ident:=gen_random_uuid(); END IF;
st:=coalesce(payload->>'status','draft');txt:=trim(coalesce(payload->>'title',payload->>'name',''));
IF action_name IN ('course_save','subject_save','topic_save','lesson_save','exam_save') AND (length(txt)=0 OR length(txt)>300) THEN RAISE EXCEPTION 'Title/name is required (maximum 300 characters)'; END IF;
IF action_name IN ('course_save','lesson_save','question_save','exam_save','exam_status') AND st NOT IN ('draft','published','archived') THEN RAISE EXCEPTION 'Invalid publication status'; END IF;
CASE action_name
WHEN 'course_save' THEN
 ent:='course';
 IF existed AND NOT EXISTS(SELECT 1 FROM public.courses WHERE id=ident) THEN RAISE EXCEPTION 'Course not found'; END IF;
 IF coalesce(payload->>'slug','') !~ '^[a-z0-9]+(-[a-z0-9]+)*$' THEN RAISE EXCEPTION 'Slug: use lowercase English letters, numbers and hyphens'; END IF;
 INSERT INTO public.courses(id,slug,title,description,price,offer_price,status) VALUES(ident,payload->>'slug',txt,coalesce(payload->>'description',''),(payload->>'price')::numeric,nullif(payload->>'offer_price','')::numeric,st)
 ON CONFLICT(id) DO UPDATE SET slug=EXCLUDED.slug,title=EXCLUDED.title,description=EXCLUDED.description,price=EXCLUDED.price,offer_price=EXCLUDED.offer_price,status=EXCLUDED.status;
 DELETE FROM public.course_subjects WHERE course_id=ident;
 INSERT INTO public.course_subjects(course_id,subject_id) SELECT ident,value::uuid FROM jsonb_array_elements_text(coalesce(payload->'subject_ids','[]'::jsonb));
WHEN 'subject_save' THEN
 ent:='subject';
 IF existed THEN UPDATE public.subjects SET name=txt WHERE id=ident;IF NOT FOUND THEN RAISE EXCEPTION 'Subject not found'; END IF;
 ELSE INSERT INTO public.subjects(id,name) VALUES(ident,txt); END IF;
WHEN 'topic_save' THEN
 ent:='topic';
 IF existed THEN
 IF EXISTS(SELECT 1 FROM public.topics WHERE id=ident AND subject_id<>(payload->>'subject_id')::uuid) THEN RAISE EXCEPTION 'Existing topic cannot move to another subject'; END IF;
 UPDATE public.topics SET name=txt WHERE id=ident;IF NOT FOUND THEN RAISE EXCEPTION 'Topic not found'; END IF;
 ELSE INSERT INTO public.topics(id,subject_id,name) VALUES(ident,(payload->>'subject_id')::uuid,txt); END IF;
WHEN 'lesson_save' THEN
 ent:='lesson';c:=(payload->>'course_id')::uuid;
 IF existed AND NOT EXISTS(SELECT 1 FROM public.lessons WHERE id=ident AND course_id=c) THEN RAISE EXCEPTION 'Lesson not found or course cannot change'; END IF;
 IF nullif(payload->>'video_url','') IS NOT NULL AND payload->>'video_url' !~ '^https://' THEN RAISE EXCEPTION 'Video URL must use https'; END IF;
 INSERT INTO public.lessons(id,course_id,title,content,video_url,position,is_preview,status) VALUES(ident,c,txt,coalesce(payload->>'content',''),nullif(payload->>'video_url',''),(payload->>'position')::int,coalesce((payload->>'is_preview')::boolean,false),st)
 ON CONFLICT(id) DO UPDATE SET title=EXCLUDED.title,content=EXCLUDED.content,video_url=EXCLUDED.video_url,position=EXCLUDED.position,is_preview=EXCLUDED.is_preview,status=EXCLUDED.status;
WHEN 'question_save' THEN
 ent:='question';txt:=trim(coalesce(payload->>'question_text',''));
 IF length(txt)=0 OR length(txt)>10000 OR jsonb_typeof(payload->'options') IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'Question and answer options are required'; END IF;
 i:=jsonb_array_length(payload->'options');idx:=(payload->>'correct_index')::int;
 IF i<2 OR i>8 OR idx IS NULL OR idx<0 OR idx>=i OR EXISTS(SELECT 1 FROM jsonb_array_elements_text(payload->'options') x WHERE length(trim(x))=0 OR length(x)>2000) THEN RAISE EXCEPTION 'Use 2–8 non-empty options and select the correct answer'; END IF;
 IF existed THEN
 IF NOT EXISTS(SELECT 1 FROM public.questions WHERE id=ident) THEN RAISE EXCEPTION 'Question not found'; END IF;
 IF EXISTS(SELECT 1 FROM public.practice_answers WHERE question_id=ident) OR EXISTS(SELECT 1 FROM public.exam_questions eq JOIN public.exams e ON e.id=eq.exam_id WHERE eq.question_id=ident AND (e.status='published' OR EXISTS(SELECT 1 FROM public.exam_attempts WHERE exam_id=e.id))) THEN RAISE EXCEPTION 'Used or published exam question is locked. Create a new question instead'; END IF;
 DELETE FROM public.question_answer_keys WHERE question_id=ident;DELETE FROM public.question_options WHERE question_id=ident;
 END IF;
 INSERT INTO public.questions(id,topic_id,created_by,question_text,explanation,difficulty,status) VALUES(ident,(payload->>'topic_id')::uuid,u,txt,coalesce(payload->>'explanation',''),coalesce(payload->>'difficulty','medium'),st)
 ON CONFLICT(id) DO UPDATE SET topic_id=EXCLUDED.topic_id,question_text=EXCLUDED.question_text,explanation=EXCLUDED.explanation,difficulty=EXCLUDED.difficulty,status=EXCLUDED.status;
 FOR r IN SELECT value,n FROM jsonb_array_elements_text(payload->'options') WITH ORDINALITY x(value,n) LOOP
 INSERT INTO public.question_options(question_id,option_text,position) VALUES(ident,trim(r.value),r.n-1) RETURNING id INTO opt;
 IF r.n-1=idx THEN INSERT INTO public.question_answer_keys(question_id,correct_option_id) VALUES(ident,opt); END IF; END LOOP;
WHEN 'exam_save' THEN
 ent:='exam';
 IF existed THEN
 IF NOT EXISTS(SELECT 1 FROM public.exams WHERE id=ident) THEN RAISE EXCEPTION 'Exam not found'; END IF;
 IF EXISTS(SELECT 1 FROM public.exam_attempts WHERE exam_id=ident) THEN RAISE EXCEPTION 'Attempted exam is locked. Create a new exam or archive this one'; END IF;
 END IF;
 IF jsonb_typeof(payload->'items') IS DISTINCT FROM 'array' OR jsonb_array_length(payload->'items')>200 THEN RAISE EXCEPTION 'Invalid question list (maximum 200)'; END IF;
 IF st='published' AND jsonb_array_length(payload->'items')=0 THEN RAISE EXCEPTION 'Add questions before publishing'; END IF;
 IF nullif(payload->>'ends_at','')::timestamptz IS NOT NULL AND nullif(payload->>'starts_at','') IS NULL THEN RAISE EXCEPTION 'Set both start and end time'; END IF;
 IF nullif(payload->>'results_at','')::timestamptz<nullif(payload->>'ends_at','')::timestamptz OR nullif(payload->>'answers_at','')::timestamptz<nullif(payload->>'ends_at','')::timestamptz THEN RAISE EXCEPTION 'Results/answers cannot release before exam end'; END IF;
 INSERT INTO public.exams(id,course_id,created_by,title,exam_type,status,duration_minutes,pass_mark,is_free,starts_at,ends_at,results_at,answers_at)
 VALUES(ident,nullif(payload->>'course_id','')::uuid,u,txt,payload->>'exam_type',st,(payload->>'duration_minutes')::int,coalesce(nullif(payload->>'pass_mark','')::numeric,0),coalesce((payload->>'is_free')::boolean,false),nullif(payload->>'starts_at','')::timestamptz,nullif(payload->>'ends_at','')::timestamptz,nullif(payload->>'results_at','')::timestamptz,nullif(payload->>'answers_at','')::timestamptz)
 ON CONFLICT(id) DO UPDATE SET course_id=EXCLUDED.course_id,title=EXCLUDED.title,exam_type=EXCLUDED.exam_type,status=EXCLUDED.status,duration_minutes=EXCLUDED.duration_minutes,pass_mark=EXCLUDED.pass_mark,is_free=EXCLUDED.is_free,starts_at=EXCLUDED.starts_at,ends_at=EXCLUDED.ends_at,results_at=EXCLUDED.results_at,answers_at=EXCLUDED.answers_at;
 DELETE FROM public.exam_questions WHERE exam_id=ident;
 FOR r IN SELECT value,n FROM jsonb_array_elements(payload->'items') WITH ORDINALITY x(value,n) LOOP
 q:=(r.value->>'id')::uuid;
 IF NOT EXISTS(SELECT 1 FROM public.questions x JOIN public.question_answer_keys k ON k.question_id=x.id WHERE x.id=q AND x.status='published') THEN RAISE EXCEPTION 'Choose published questions with answer keys'; END IF;
 INSERT INTO public.exam_questions(exam_id,question_id,position,marks,negative_marks) VALUES(ident,q,r.n-1,(r.value->>'marks')::numeric,(r.value->>'negative_marks')::numeric); END LOOP;
IF st='published' AND (SELECT pass_mark FROM public.exams WHERE id=ident)>(SELECT coalesce(sum(marks),0) FROM public.exam_questions WHERE exam_id=ident) THEN RAISE EXCEPTION 'Pass mark cannot exceed total marks'; END IF;
WHEN 'exam_status' THEN
 ent:='exam';IF st<>'archived' THEN RAISE EXCEPTION 'Only archive is supported here'; END IF;
 IF EXISTS(SELECT 1 FROM public.exam_attempts WHERE exam_id=ident AND status='in_progress' AND deadline_at>now()) THEN RAISE EXCEPTION 'Wait until active attempts finish before archiving'; END IF;
 UPDATE public.exams SET status=st WHERE id=ident;IF NOT FOUND THEN RAISE EXCEPTION 'Exam not found'; END IF;
WHEN 'request_review' THEN
 ent:='enrollment_request';SELECT * INTO req FROM public.enrollment_requests WHERE id=ident FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Request not found'; END IF;
 IF payload->>'decision' NOT IN ('approved','rejected') OR payload->>'decision' IS NULL THEN RAISE EXCEPTION 'Invalid decision'; END IF;
 IF req.status<>'pending' THEN RAISE EXCEPTION 'This request has already been reviewed'; END IF;
 IF payload->>'decision'='approved' THEN
 IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=req.student_id AND status='active') THEN RAISE EXCEPTION 'Student account is suspended'; END IF;
 IF NOT EXISTS(SELECT 1 FROM public.courses WHERE id=req.course_id AND status='published') THEN RAISE EXCEPTION 'Publish the course before approval'; END IF;
 INSERT INTO public.enrollments(student_id,course_id) VALUES(req.student_id,req.course_id) ON CONFLICT(student_id,course_id) DO UPDATE SET status='active',expires_at=NULL;
 END IF;
 UPDATE public.enrollment_requests SET status=payload->>'decision',reviewed_by=u,reviewed_at=now() WHERE id=ident;
WHEN 'student_status' THEN
 ent:='profile';IF payload->>'status' NOT IN ('active','suspended') OR payload->>'status' IS NULL THEN RAISE EXCEPTION 'Invalid account status'; END IF;
 UPDATE public.profiles SET status=payload->>'status' WHERE id=ident AND role<>'admin' AND id<>u;
 IF NOT FOUND THEN RAISE EXCEPTION 'Admin accounts cannot be changed here'; END IF;
ELSE RAISE EXCEPTION 'Unknown admin action'; END CASE;
INSERT INTO public.audit_logs(actor_id,action,entity_type,entity_id) VALUES(u,action_name||CASE WHEN action_name='request_review' THEN ':'||(payload->>'decision') WHEN action_name='student_status' THEN ':'||(payload->>'status') ELSE '' END,ent,ident::text);
RETURN jsonb_build_object('id',ident,'message','সংরক্ষিত হয়েছে।'); END $$;


INSERT INTO public.site_settings(key,value) VALUES('leaderboard_runtime','{"version":1}') ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value;
COMMIT;
