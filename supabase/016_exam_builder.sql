-- Run after 015. Admin-only read tools; generation/preview never creates attempts.
BEGIN;
CREATE OR REPLACE FUNCTION public.aarohon_exam_builder(action_name text,payload jsonb DEFAULT '{}'::jsonb) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path='' AS $$
DECLARE u uuid:=aarohon_private.require_admin(); result jsonb; topic_ids uuid[]; ids uuid[]; picked uuid[]:='{}'; r record; n int; wanted int; available int; difficulty_filter text:=coalesce(payload->>'difficulty',''); fresh boolean:=coalesce((payload->>'fresh')::boolean,false); exam_ident uuid; entries jsonb;
BEGIN
 IF jsonb_typeof(payload) IS DISTINCT FROM 'object' OR octet_length(payload::text)>100000 THEN RAISE EXCEPTION 'Invalid request'; END IF;
 IF difficulty_filter NOT IN ('','easy','medium','hard') THEN RAISE EXCEPTION 'Invalid difficulty'; END IF;
 IF action_name='topics' THEN
 SELECT coalesce(jsonb_agg(x ORDER BY x.subject,x.title),'[]'::jsonb) INTO result FROM (
 SELECT t.id,t.name title,s.name subject,count(q.id) FILTER(WHERE q.status='published' AND EXISTS(SELECT 1 FROM public.question_answer_keys k WHERE k.question_id=q.id)) available
 FROM public.topics t JOIN public.subjects s ON s.id=t.subject_id LEFT JOIN public.questions q ON q.topic_id=t.id GROUP BY t.id,t.name,s.name) x;
 RETURN result;
 ELSIF action_name='generate' THEN
 IF jsonb_typeof(payload->'topics') IS DISTINCT FROM 'array' OR jsonb_array_length(payload->'topics') NOT BETWEEN 1 AND 200 THEN RAISE EXCEPTION '১–২০০টি টপিক নির্বাচন করুন।'; END IF;
 SELECT array_agg((x->>'id')::uuid) INTO topic_ids FROM jsonb_array_elements(payload->'topics') x;
 IF array_position(topic_ids,NULL) IS NOT NULL OR cardinality(topic_ids)<>(SELECT count(DISTINCT t) FROM unnest(topic_ids) t) OR (SELECT count(*) FROM public.topics WHERE id=ANY(topic_ids))<>cardinality(topic_ids) THEN RAISE EXCEPTION 'টপিক তালিকা ঠিক নেই বা একই টপিক একাধিকবার আছে।'; END IF;
 IF payload->>'mode'='quota' THEN
 SELECT sum((x->>'count')::int) INTO wanted FROM jsonb_array_elements(payload->'topics') x;
 IF wanted IS NULL OR wanted NOT BETWEEN 1 AND 200 OR EXISTS(SELECT 1 FROM jsonb_array_elements(payload->'topics') x WHERE (x->>'count') IS NULL OR (x->>'count')::int NOT BETWEEN 1 AND 200) THEN RAISE EXCEPTION 'প্রতি টপিকের সংখ্যা দিন; মোট সর্বোচ্চ ২০০টি প্রশ্ন।'; END IF;
 ELSIF payload->>'mode'='random' THEN
 wanted:=(payload->>'count')::int;
 IF wanted IS NULL OR wanted NOT BETWEEN 1 AND 200 THEN RAISE EXCEPTION 'মোট প্রশ্ন ১–২০০টির মধ্যে দিন।'; END IF;
 ELSE RAISE EXCEPTION 'Invalid generation mode'; END IF;
 FOR r IN SELECT t.id,t.name,CASE WHEN payload->>'mode'='quota' THEN (x->>'count')::int ELSE wanted END amount
 FROM jsonb_array_elements(payload->'topics') x JOIN public.topics t ON t.id=(x->>'id')::uuid LOOP
 SELECT array_agg(id) INTO ids FROM (
 SELECT q.id FROM public.questions q WHERE q.status='published' AND EXISTS(SELECT 1 FROM public.question_answer_keys k WHERE k.question_id=q.id)
 AND (CASE WHEN payload->>'mode'='quota' THEN q.topic_id=r.id ELSE q.topic_id=ANY(topic_ids) END)
 AND (difficulty_filter='' OR q.difficulty=difficulty_filter)
 AND (NOT fresh OR (NOT EXISTS(SELECT 1 FROM public.practice_answers pa WHERE pa.question_id=q.id) AND NOT EXISTS(SELECT 1 FROM public.exam_questions eq JOIN public.exams e ON e.id=eq.exam_id WHERE eq.question_id=q.id AND (e.status='published' OR EXISTS(SELECT 1 FROM public.exam_attempts a WHERE a.exam_id=e.id)))))
 ORDER BY random() LIMIT r.amount) x;
 available:=coalesce(cardinality(ids),0);
 IF available<r.amount THEN RAISE EXCEPTION 'প্রশ্ন কম আছে: % — দরকার %, পাওয়া গেছে % (বর্তমান filter অনুযায়ী)।',CASE WHEN payload->>'mode'='quota' THEN r.name ELSE 'নির্বাচিত টপিকগুলো' END,r.amount,available; END IF;
 picked:=picked||ids;
 EXIT WHEN payload->>'mode'='random';
 END LOOP;
 SELECT jsonb_agg(jsonb_build_object('id',q.id,'title',q.question_text,'marks',1,'negative_marks',0) ORDER BY random()) INTO result FROM public.questions q WHERE q.id=ANY(picked);
 RETURN result;
 ELSIF action_name='preview' THEN
 exam_ident:=nullif(payload->>'examId','')::uuid;
 IF exam_ident IS NOT NULL THEN
 SELECT jsonb_agg(jsonb_build_object('id',question_id,'marks',marks,'negative_marks',negative_marks) ORDER BY position) INTO entries FROM public.exam_questions WHERE exam_id=exam_ident;
 IF NOT EXISTS(SELECT 1 FROM public.exams WHERE id=exam_ident) THEN RAISE EXCEPTION 'Exam not found'; END IF;
 ELSE entries:=payload->'items'; END IF;
 entries:=coalesce(entries,'[]'::jsonb);
 IF jsonb_typeof(entries) IS DISTINCT FROM 'array' OR jsonb_array_length(entries)>200 THEN RAISE EXCEPTION 'Maximum 200 questions'; END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(entries) x WHERE (x->>'marks') IS NULL OR (x->>'marks')::numeric<=0 OR (x->>'negative_marks') IS NULL OR (x->>'negative_marks')::numeric<0 OR (x->>'negative_marks')::numeric>(x->>'marks')::numeric) THEN RAISE EXCEPTION 'প্রশ্নের নম্বর ও কর্তন ঠিক করুন।'; END IF;
 SELECT coalesce(jsonb_agg(aarohon_private.question_dto(q.id,true)||jsonb_build_object('topic_id',q.topic_id,'difficulty',q.difficulty,'status',q.status,'marks',(x.value->>'marks')::numeric,'negative_marks',(x.value->>'negative_marks')::numeric) ORDER BY x.n),'[]'::jsonb)
 INTO result FROM jsonb_array_elements(entries) WITH ORDINALITY x(value,n) JOIN public.questions q ON q.id=(x.value->>'id')::uuid JOIN public.question_answer_keys k ON k.question_id=q.id;
 IF jsonb_array_length(result)<>jsonb_array_length(entries) OR EXISTS(SELECT 1 FROM jsonb_array_elements(result) x WHERE (x->>'answer')::int<0) THEN RAISE EXCEPTION 'কিছু প্রশ্ন বা সঠিক উত্তর আর পাওয়া যাচ্ছে না।'; END IF;
 RETURN jsonb_build_object('questions',result,'exam',CASE WHEN exam_ident IS NULL THEN NULL ELSE (SELECT jsonb_build_object('title',title,'exam_type',exam_type,'duration_minutes',duration_minutes,'pass_mark',pass_mark) FROM public.exams WHERE id=exam_ident) END);
 ELSE RAISE EXCEPTION 'Unknown builder action'; END IF;
END $$;
REVOKE ALL ON FUNCTION public.aarohon_exam_builder(text,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.aarohon_exam_builder(text,jsonb) TO authenticated;
COMMIT;
