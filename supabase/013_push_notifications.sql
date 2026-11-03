BEGIN;
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), student_id uuid NOT NULL REFERENCES public.profiles(id),
 endpoint text NOT NULL UNIQUE, p256dh text NOT NULL, auth_key text NOT NULL, enabled boolean NOT NULL DEFAULT true, updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.push_campaigns (
 id uuid PRIMARY KEY REFERENCES public.notifications(id), created_by uuid NOT NULL REFERENCES public.profiles(id), course_id uuid REFERENCES public.courses(id), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.push_deliveries (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), campaign_id uuid NOT NULL REFERENCES public.push_campaigns(id), subscription_id uuid NOT NULL REFERENCES public.push_subscriptions(id),
 student_id uuid NOT NULL REFERENCES public.profiles(id), status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','sending','sent','failed','expired','skipped')),
 attempts integer NOT NULL DEFAULT 0, lease uuid, available_at timestamptz NOT NULL DEFAULT now(), UNIQUE(campaign_id,subscription_id)
);
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_deliveries ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.push_subscriptions,public.push_campaigns,public.push_deliveries FROM PUBLIC,anon,authenticated;
CREATE INDEX IF NOT EXISTS push_delivery_queue ON public.push_deliveries(campaign_id,status,available_at);
CREATE OR REPLACE FUNCTION public.aarohon_push(action_name text,payload jsonb DEFAULT '{}'::jsonb) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE u uuid; c uuid; n uuid; url text; sub public.push_subscriptions%ROWTYPE; d public.push_deliveries%ROWTYPE; result jsonb:='[]'::jsonb; rec record; total integer; pg integer;
BEGIN
u:=aarohon_private.require_student();
IF jsonb_typeof(payload) IS DISTINCT FROM 'object' OR octet_length(payload::text)>12000 THEN RAISE EXCEPTION 'Invalid notification request'; END IF;
IF action_name IN ('subscribe','unsubscribe') THEN
 url:=payload->>'endpoint';
 IF action_name='unsubscribe' THEN UPDATE public.push_subscriptions SET enabled=false WHERE endpoint=url AND student_id=u; RETURN '{}'::jsonb; END IF;
 IF url IS NULL OR length(url)>2048 OR url !~ '^https://(fcm\.googleapis\.com|updates\.push\.services\.mozilla\.com|web\.push\.apple\.com|([a-zA-Z0-9-]+\.)*notify\.windows\.com)/[^[:space:]]+$'
 OR coalesce(payload->>'p256dh','') !~ '^[A-Za-z0-9_-]{87}=?$' OR coalesce(payload->>'auth','') !~ '^[A-Za-z0-9_-]{22}={0,2}$' THEN RAISE EXCEPTION 'Unsupported push subscription'; END IF;
 INSERT INTO public.push_subscriptions(student_id,endpoint,p256dh,auth_key) VALUES(u,url,payload->>'p256dh',payload->>'auth')
 ON CONFLICT(endpoint) DO UPDATE SET student_id=u,p256dh=EXCLUDED.p256dh,auth_key=EXCLUDED.auth_key,enabled=true,updated_at=now();
 RETURN '{}'::jsonb;
END IF;
u:=aarohon_private.require_admin();
IF action_name='create' THEN
 n:=(payload->>'id')::uuid;c:=nullif(payload->>'courseId','')::uuid;url:=coalesce(nullif(payload->>'url',''),'/dashboard');
 IF n IS NULL OR length(trim(coalesce(payload->>'title',''))) NOT BETWEEN 1 AND 100 OR length(trim(coalesce(payload->>'body',''))) NOT BETWEEN 1 AND 500
 OR url !~ '^/[a-zA-Z0-9/_?=&%#.-]*$' OR left(url,2)='//' OR length(url)>500 THEN RAISE EXCEPTION 'Use a title, message and a local site path'; END IF;
 PERFORM pg_advisory_xact_lock(680013);
 IF EXISTS(SELECT 1 FROM public.push_campaigns WHERE id=n) THEN RETURN jsonb_build_object('id',n); END IF;
 IF c IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.courses WHERE id=c AND status='published') THEN RAISE EXCEPTION 'Select a published course'; END IF;
 INSERT INTO public.notifications(id,title,body,action_url) VALUES(n,trim(payload->>'title'),trim(payload->>'body'),url);
 INSERT INTO public.push_campaigns(id,created_by,course_id) VALUES(n,u,c);
 INSERT INTO public.notification_recipients(notification_id,student_id)
 SELECT n,p.id FROM public.profiles p WHERE p.status='active' AND p.role='student' AND (c IS NULL OR aarohon_private.has_course(p.id,c));
 INSERT INTO public.push_deliveries(campaign_id,subscription_id,student_id)
 SELECT n,s.id,s.student_id FROM public.push_subscriptions s JOIN public.notification_recipients r ON r.student_id=s.student_id AND r.notification_id=n WHERE s.enabled;
 INSERT INTO public.audit_logs(actor_id,action,entity_type,entity_id) VALUES(u,'notification_send','notification',n::text);
 RETURN jsonb_build_object('id',n);
ELSIF action_name='claim' THEN
 n:=(payload->>'id')::uuid;
 UPDATE public.push_deliveries SET status='failed' WHERE campaign_id=n AND status='sending' AND available_at<=now() AND attempts>=3;
 UPDATE public.push_deliveries queued SET status='skipped' FROM public.push_subscriptions s, public.push_campaigns pc, public.profiles p
 WHERE queued.campaign_id=n AND queued.subscription_id=s.id AND pc.id=n AND p.id=queued.student_id AND queued.status IN ('pending','sending') AND queued.available_at<=now()
 AND (NOT s.enabled OR s.student_id<>queued.student_id OR p.status<>'active' OR p.role<>'student' OR (pc.course_id IS NOT NULL AND NOT aarohon_private.has_course(queued.student_id,pc.course_id)));
 FOR d IN SELECT * FROM public.push_deliveries WHERE campaign_id=n AND status IN ('pending','sending') AND available_at<=now() AND attempts<3 ORDER BY id LIMIT 10 FOR UPDATE SKIP LOCKED LOOP
  SELECT * INTO sub FROM public.push_subscriptions WHERE id=d.subscription_id;
  SELECT course_id INTO c FROM public.push_campaigns WHERE id=n;
  IF NOT sub.enabled OR sub.student_id<>d.student_id OR NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=d.student_id AND status='active' AND role='student') OR (c IS NOT NULL AND NOT aarohon_private.has_course(d.student_id,c)) THEN
   UPDATE public.push_deliveries SET status='skipped' WHERE id=d.id; CONTINUE;
  END IF;
  UPDATE public.push_deliveries SET status='sending',attempts=attempts+1,lease=gen_random_uuid(),available_at=now()+interval '2 minutes' WHERE id=d.id RETURNING * INTO d;
  result:=result||jsonb_build_array(jsonb_build_object('id',d.id,'lease',d.lease,'endpoint',sub.endpoint,'keys',jsonb_build_object('p256dh',sub.p256dh,'auth',sub.auth_key),
   'notification',(SELECT jsonb_build_object('id',id,'title',title,'body',body,'url',action_url) FROM public.notifications WHERE id=n)));
 END LOOP;
 RETURN result;
ELSIF action_name='ack' THEN
 FOR rec IN SELECT value x FROM jsonb_array_elements(payload->'results') LOOP
  SELECT * INTO d FROM public.push_deliveries WHERE id=(rec.x->>'id')::uuid AND lease=(rec.x->>'lease')::uuid AND status='sending' FOR UPDATE;
  IF NOT FOUND THEN CONTINUE; END IF;
  IF rec.x->>'status'='expired' THEN UPDATE public.push_subscriptions SET enabled=false WHERE id=d.subscription_id; END IF;
  UPDATE public.push_deliveries SET status=CASE WHEN rec.x->>'status' IN ('sent','expired','skipped') THEN rec.x->>'status' WHEN attempts>=3 THEN 'failed' ELSE 'pending' END,
  available_at=now()+interval '30 seconds' WHERE id=d.id;
 END LOOP;
 RETURN '{}'::jsonb;
ELSIF action_name='list' THEN
 pg:=greatest(1,least(100000,coalesce((payload->>'page')::int,1)));
 SELECT count(*) INTO total FROM public.push_campaigns;
 SELECT coalesce(jsonb_agg(x ORDER BY x.created_at DESC),'[]'::jsonb) INTO result FROM (
  SELECT c.id,c.created_at,n.title,n.body,coalesce(co.title,'সকল শিক্ষার্থী') audience,
   (SELECT count(*) FROM public.notification_recipients WHERE notification_id=c.id) recipients,
   (SELECT count(*) FROM public.push_deliveries WHERE campaign_id=c.id AND status='sent') sent,
   (SELECT count(*) FROM public.push_deliveries WHERE campaign_id=c.id AND status IN ('pending','sending')) pending,
   (SELECT count(*) FROM public.push_deliveries WHERE campaign_id=c.id AND status IN ('failed','expired')) failed
  FROM public.push_campaigns c JOIN public.notifications n ON n.id=c.id LEFT JOIN public.courses co ON co.id=c.course_id ORDER BY c.created_at DESC LIMIT 25 OFFSET (pg-1)*25
 ) x;
 RETURN jsonb_build_object('rows',result,'total',total,'page',pg);
END IF;
RAISE EXCEPTION 'Unknown notification action';
END $$;
REVOKE ALL ON FUNCTION public.aarohon_push(text,jsonb) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.aarohon_push(text,jsonb) TO authenticated;
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
'notifications',coalesce((SELECT jsonb_agg(jsonb_build_object('id',n.id,'title',n.title,'body',n.body,'url',n.action_url,'read',r.read_at IS NOT NULL) ORDER BY n.created_at DESC) FROM public.notifications n JOIN public.notification_recipients r ON r.notification_id=n.id WHERE r.student_id=u),'[]'::jsonb),
'referralCode',(SELECT code FROM public.referral_codes WHERE student_id=u AND is_active),
'referralCount',(SELECT count(*) FROM public.referrals r JOIN public.referral_codes c ON c.id=r.referral_code_id WHERE c.student_id=u),
'leaderboard',coalesce((SELECT jsonb_agg(jsonb_build_object('name',z.name,'score',z.score)) FROM (
SELECT CASE WHEN a.student_id=u THEN 'আপনি' ELSE 'শিক্ষার্থী '||left(a.student_id::text,8) END name,sum(a.score) score
FROM public.exam_attempts a JOIN public.exams e ON e.id=a.exam_id WHERE e.exam_type='live' AND e.status='published' AND a.status='submitted' AND now()>=greatest(coalesce(e.results_at,'-infinity'::timestamptz),coalesce(e.ends_at,'-infinity'::timestamptz))
GROUP BY a.student_id ORDER BY sum(a.score) DESC LIMIT 20) z),'[]'::jsonb)
) INTO result; RETURN result; END $$;
COMMIT;
