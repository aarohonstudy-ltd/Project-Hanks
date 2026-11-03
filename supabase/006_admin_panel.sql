-- Run AFTER 001 (existing setup) and 005. Additive/repeatable. No service key.
BEGIN;
CREATE OR REPLACE FUNCTION aarohon_private.require_admin() RETURNS uuid
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE u uuid:=auth.uid(); BEGIN
IF u IS NULL OR NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=u AND role='admin' AND status='active') THEN
 RAISE EXCEPTION 'Admin access required' USING ERRCODE='42501'; END IF;
RETURN u; END $$;
REVOKE ALL ON FUNCTION aarohon_private.require_admin() FROM PUBLIC,anon,authenticated;

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
WHEN 'results' THEN base:=$q$SELECT a.id,a.student_id,a.status,a.score,a.correct_count,a.wrong_count,a.skipped_count,a.started_at created_at,a.submitted_at,p.full_name student_name,e.title exam_title,p.full_name||' '||e.title search_value FROM public.exam_attempts a JOIN public.profiles p ON p.id=a.student_id JOIN public.exams e ON e.id=a.exam_id$q$;
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
 INSERT INTO public.exams(id,course_id,created_by,title,exam_type,status,duration_minutes,is_free,starts_at,ends_at,results_at,answers_at)
 VALUES(ident,nullif(payload->>'course_id','')::uuid,u,txt,payload->>'exam_type',st,(payload->>'duration_minutes')::int,coalesce((payload->>'is_free')::boolean,false),nullif(payload->>'starts_at','')::timestamptz,nullif(payload->>'ends_at','')::timestamptz,nullif(payload->>'results_at','')::timestamptz,nullif(payload->>'answers_at','')::timestamptz)
 ON CONFLICT(id) DO UPDATE SET course_id=EXCLUDED.course_id,title=EXCLUDED.title,exam_type=EXCLUDED.exam_type,status=EXCLUDED.status,duration_minutes=EXCLUDED.duration_minutes,is_free=EXCLUDED.is_free,starts_at=EXCLUDED.starts_at,ends_at=EXCLUDED.ends_at,results_at=EXCLUDED.results_at,answers_at=EXCLUDED.answers_at;
 DELETE FROM public.exam_questions WHERE exam_id=ident;
 FOR r IN SELECT value,n FROM jsonb_array_elements(payload->'items') WITH ORDINALITY x(value,n) LOOP
 q:=(r.value->>'id')::uuid;
 IF NOT EXISTS(SELECT 1 FROM public.questions x JOIN public.question_answer_keys k ON k.question_id=x.id WHERE x.id=q AND x.status='published') THEN RAISE EXCEPTION 'Choose published questions with answer keys'; END IF;
 INSERT INTO public.exam_questions(exam_id,question_id,position,marks,negative_marks) VALUES(ident,q,r.n-1,(r.value->>'marks')::numeric,(r.value->>'negative_marks')::numeric); END LOOP;
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

-- Preserve the existing tested student implementation behind a permission-checked wrapper.
DO $$ BEGIN
IF to_regprocedure('public.aarohon_student_action_core(text,jsonb)') IS NULL THEN
 ALTER FUNCTION public.aarohon_student_action(text,jsonb) RENAME TO aarohon_student_action_core;
END IF; END $$;
REVOKE ALL ON FUNCTION public.aarohon_student_action_core(text,jsonb) FROM PUBLIC,anon,authenticated;
CREATE OR REPLACE FUNCTION public.aarohon_student_action(action text,payload jsonb DEFAULT '{}'::jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$ BEGIN
PERFORM pg_advisory_xact_lock_shared(680006);
RETURN public.aarohon_student_action_core(action,payload); END $$;
REVOKE ALL ON FUNCTION public.aarohon_student_action(text,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.aarohon_student_action(text,jsonb) TO authenticated;
REVOKE ALL ON FUNCTION public.aarohon_admin_data(text,text,integer),public.aarohon_admin_options(),public.aarohon_admin_save(text,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.aarohon_admin_data(text,text,integer),public.aarohon_admin_options(),public.aarohon_admin_save(text,jsonb) TO authenticated;
INSERT INTO public.site_settings(key,value) VALUES('admin_runtime','{"version":1}') ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value;
COMMIT;
