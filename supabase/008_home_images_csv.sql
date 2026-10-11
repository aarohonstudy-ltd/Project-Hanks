-- Run AFTER 005, 006 and 007 in the existing NEW Supabase project.
-- Additive and repeatable: no content or account reset.
BEGIN;

INSERT INTO storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
VALUES('course-images','course-images',true,5242880,ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT(id) DO UPDATE SET public=true,file_size_limit=EXCLUDED.file_size_limit,allowed_mime_types=EXCLUDED.allowed_mime_types;
DROP POLICY IF EXISTS aarohon_admin_course_image_insert ON storage.objects;
CREATE POLICY aarohon_admin_course_image_insert ON storage.objects FOR INSERT TO authenticated
WITH CHECK(bucket_id='course-images' AND EXISTS(SELECT 1 FROM public.profiles WHERE id=(SELECT auth.uid()) AND role='admin' AND status='active'));

-- Import provenance is private. Original IDs/metadata survive without legacy user accounts.
CREATE TABLE IF NOT EXISTS public.question_import_sources(
 source_id uuid PRIMARY KEY,
 question_id uuid NOT NULL UNIQUE REFERENCES public.questions(id),
 course_id uuid NOT NULL REFERENCES public.courses(id),
 source_row jsonb NOT NULL,
 imported_by uuid NOT NULL REFERENCES public.profiles(id),
 imported_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.question_import_sources ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.question_import_sources FROM PUBLIC,anon,authenticated;
CREATE INDEX IF NOT EXISTS question_import_course_idx ON public.question_import_sources(course_id);

CREATE OR REPLACE FUNCTION aarohon_private.can_study(u uuid,q uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
SELECT EXISTS(SELECT 1 FROM public.questions x JOIN public.topics t ON t.id=x.topic_id
WHERE x.id=q AND x.status='published' AND aarohon_private.question_released(x.id)
AND (
 EXISTS(SELECT 1 FROM public.question_import_sources src JOIN public.courses c ON c.id=src.course_id WHERE src.question_id=x.id AND c.status='published' AND aarohon_private.has_course(u,c.id))
 OR (NOT EXISTS(SELECT 1 FROM public.question_import_sources src WHERE src.question_id=x.id)
 AND EXISTS(SELECT 1 FROM public.course_subjects cs JOIN public.courses c ON c.id=cs.course_id WHERE cs.subject_id=t.subject_id AND c.status='published' AND aarohon_private.has_course(u,c.id)))
 OR EXISTS(SELECT 1 FROM public.exam_questions eq JOIN public.exams e ON e.id=eq.exam_id WHERE eq.question_id=x.id AND e.is_free AND e.status='published')
)) $$;

CREATE OR REPLACE FUNCTION public.aarohon_public_home() RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
SELECT jsonb_build_object(
'courses',coalesce((SELECT jsonb_agg(jsonb_build_object(
'id',c.id,'title',c.title,'description',c.description,'category','আরোহণ',
'cover',coalesce(c.thumbnail_url,''),'price',coalesce(c.offer_price,c.price),'originalPrice',c.price,
'lessons',(SELECT count(*) FROM public.lessons l WHERE l.course_id=c.id AND l.status='published'),
'features',coalesce((SELECT jsonb_agg(s.name ORDER BY s.name) FROM public.course_subjects cs JOIN public.subjects s ON s.id=cs.subject_id WHERE cs.course_id=c.id),'[]'::jsonb)
) ORDER BY c.created_at DESC) FROM public.courses c WHERE c.status='published'),'[]'::jsonb),
'analytics',jsonb_build_object(
'students',(SELECT count(*) FROM public.profiles WHERE role='student' AND status='active'),
'questions',(SELECT count(*) FROM public.questions WHERE status='published'),
'examsTaken',(SELECT count(*) FROM public.exam_attempts WHERE status IN ('submitted','expired'))),
'videos',coalesce((SELECT jsonb_agg(v.item) FROM (
SELECT jsonb_build_object('id',l.id,'title',l.title,'src',l.video_url,'poster',coalesce(c.thumbnail_url,'')) item
FROM public.lessons l JOIN public.courses c ON c.id=l.course_id
WHERE l.status='published' AND c.status='published' AND l.is_preview AND l.video_url ~ '^https://'
ORDER BY l.created_at DESC LIMIT 6) v),'[]'::jsonb)
) $$;
REVOKE ALL ON FUNCTION public.aarohon_public_home() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.aarohon_public_home() TO anon,authenticated;

CREATE OR REPLACE FUNCTION public.aarohon_import_questions(rows_json jsonb,course_map jsonb,question_status text DEFAULT 'draft') RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE u uuid; r jsonb; prior public.question_import_sources%ROWTYPE; old_id uuid; c uuid; sid uuid; tid uuid; qid uuid; oid uuid; opt record; target text; course_name text; idx int; n int; added int:=0; skipped int:=0; changed int:=0; dt timestamptz;
BEGIN
 u:=aarohon_private.require_admin();
 PERFORM pg_advisory_xact_lock(680006);
 IF jsonb_typeof(rows_json) IS DISTINCT FROM 'array' OR jsonb_array_length(rows_json) NOT BETWEEN 1 AND 100 OR octet_length(rows_json::text)>500000 THEN RAISE EXCEPTION 'Import requires 1–100 rows (maximum 500 KB per batch)'; END IF;
 IF jsonb_typeof(course_map) IS DISTINCT FROM 'object' OR question_status IS NULL OR question_status NOT IN ('draft','published') THEN RAISE EXCEPTION 'Invalid course mapping or status'; END IF;
 FOR r IN SELECT value FROM jsonb_array_elements(rows_json) LOOP
  old_id:=(r->>'id')::uuid;
  IF old_id IS NULL OR length(trim(coalesce(r->>'q',''))) NOT BETWEEN 1 AND 10000 OR length(coalesce(r->>'exp',''))>20000 THEN RAISE EXCEPTION 'Invalid question text or source ID'; END IF;
  IF length(trim(coalesce(r->>'subject',''))) NOT BETWEEN 1 AND 300 OR length(trim(coalesce(r->>'topic',''))) NOT BETWEEN 1 AND 1000 OR length(trim(coalesce(r->>'course',''))) NOT BETWEEN 1 AND 300 THEN RAISE EXCEPTION 'Subject, topic and course are required'; END IF;
  IF jsonb_typeof(r->'opts') IS DISTINCT FROM 'array' THEN RAISE EXCEPTION 'Options must be a JSON array'; END IF;
  n:=jsonb_array_length(r->'opts');idx:=(r->>'correct')::int;
  IF n NOT BETWEEN 2 AND 8 OR idx IS NULL OR idx<0 OR idx>=n OR EXISTS(SELECT 1 FROM jsonb_array_elements(r->'opts') x WHERE jsonb_typeof(x)<>'string' OR length(trim(x#>>'{}')) NOT BETWEEN 1 AND 2000) THEN RAISE EXCEPTION 'Invalid options or zero-based correct index'; END IF;
  IF jsonb_typeof(r->'is_master') IS DISTINCT FROM 'boolean' THEN RAISE EXCEPTION 'is_master must be true or false'; END IF;
  dt:=nullif(r->>'created_at','')::timestamptz;
  IF dt IS NULL OR NOT isfinite(dt) THEN RAISE EXCEPTION 'Valid source creation date required'; END IF;
  course_name:=trim(r->>'course');target:=course_map->>course_name;
  IF target IS NULL OR target='' OR target='skip' THEN RAISE EXCEPTION 'Choose a target course for every submitted row'; END IF;
  IF target='new' THEN
   INSERT INTO public.courses(slug,title,status,price) VALUES('import-'||md5(course_name),course_name,'draft',0) ON CONFLICT(slug) DO NOTHING;
   SELECT id INTO c FROM public.courses WHERE slug='import-'||md5(course_name);
  ELSE
   c:=target::uuid;
   IF NOT EXISTS(SELECT 1 FROM public.courses WHERE id=c) THEN RAISE EXCEPTION 'Target course does not exist'; END IF;
  END IF;
  SELECT * INTO prior FROM public.question_import_sources WHERE source_id=old_id;
  IF FOUND THEN
   IF prior.course_id<>c THEN RAISE EXCEPTION 'Source ID % already belongs to another course. Keep the original mapping when retrying.',old_id; END IF;
   skipped:=skipped+1;
   IF prior.source_row<>r THEN changed:=changed+1; END IF;
   CONTINUE;
  END IF;
  INSERT INTO public.subjects(name) VALUES(trim(r->>'subject')) ON CONFLICT(name) DO NOTHING;
  SELECT id INTO sid FROM public.subjects WHERE name=trim(r->>'subject');
  SELECT id INTO tid FROM public.topics WHERE subject_id=sid AND parent_id IS NULL AND lower(name)=lower(trim(r->>'topic'));
  IF tid IS NULL THEN INSERT INTO public.topics(subject_id,name) VALUES(sid,trim(r->>'topic')) RETURNING id INTO tid; END IF;
  INSERT INTO public.course_subjects(course_id,subject_id) VALUES(c,sid) ON CONFLICT DO NOTHING;
  INSERT INTO public.questions(topic_id,created_by,question_text,explanation,status,created_at)
  VALUES(tid,u,r->>'q',coalesce(r->>'exp',''),question_status,dt) RETURNING id INTO qid;
  FOR opt IN SELECT value,pos FROM jsonb_array_elements_text(r->'opts') WITH ORDINALITY x(value,pos) LOOP
   INSERT INTO public.question_options(question_id,option_text,position) VALUES(qid,opt.value,opt.pos-1) RETURNING id INTO oid;
   IF opt.pos-1=idx THEN INSERT INTO public.question_answer_keys(question_id,correct_option_id) VALUES(qid,oid); END IF;
  END LOOP;
  INSERT INTO public.question_import_sources(source_id,question_id,course_id,source_row,imported_by) VALUES(old_id,qid,c,r,u);
  added:=added+1;
 END LOOP;
 INSERT INTO public.audit_logs(actor_id,action,entity_type,entity_id) VALUES(u,'question_csv_import:'||added||':skipped:'||skipped,'question_import',gen_random_uuid()::text);
 RETURN jsonb_build_object('imported',added,'skipped',skipped,'changed',changed);
END $$;
REVOKE ALL ON FUNCTION public.aarohon_import_questions(jsonb,jsonb,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.aarohon_import_questions(jsonb,jsonb,text) TO authenticated;

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
 IF nullif(payload->>'thumbnail_url','') IS NOT NULL AND (payload->>'thumbnail_url' !~ '^https://' OR length(payload->>'thumbnail_url')>2000) THEN RAISE EXCEPTION 'Image URL must use https (maximum 2000 characters)'; END IF;
 IF existed AND NOT EXISTS(SELECT 1 FROM public.courses WHERE id=ident) THEN RAISE EXCEPTION 'Course not found'; END IF;
 IF coalesce(payload->>'slug','') !~ '^[a-z0-9]+(-[a-z0-9]+)*$' THEN RAISE EXCEPTION 'Slug: use lowercase English letters, numbers and hyphens'; END IF;
 INSERT INTO public.courses(id,slug,title,description,thumbnail_url,price,offer_price,status) VALUES(ident,payload->>'slug',txt,coalesce(payload->>'description',''),nullif(payload->>'thumbnail_url',''),(payload->>'price')::numeric,nullif(payload->>'offer_price','')::numeric,st)
 ON CONFLICT(id) DO UPDATE SET slug=EXCLUDED.slug,title=EXCLUDED.title,description=EXCLUDED.description,thumbnail_url=EXCLUDED.thumbnail_url,price=EXCLUDED.price,offer_price=EXCLUDED.offer_price,status=EXCLUDED.status;
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



CREATE OR REPLACE FUNCTION public.aarohon_dashboard() RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE u uuid:=aarohon_private.require_student(); result jsonb; BEGIN
SELECT jsonb_build_object(
'profile',(SELECT jsonb_build_object('id',p.id,'name',p.full_name,'email',a.email,'goal',coalesce(p.preparation_goal,'')) FROM public.profiles p JOIN auth.users a ON a.id=p.id WHERE p.id=u),
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


INSERT INTO public.site_settings(key,value) VALUES('home_import_runtime','{"version":1}') ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value;
COMMIT;
