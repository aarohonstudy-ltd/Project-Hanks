-- Run after 016. Add course identity to existing dashboard exam metadata.
BEGIN;
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
'isFree',e.is_free,'courseId',e.course_id,'closed',e.ends_at IS NOT NULL AND e.ends_at<=now(),'date',coalesce(to_char(e.starts_at AT TIME ZONE 'Asia/Dhaka','DD Mon YYYY HH24:MI'),'যেকোনো সময়'),
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
COMMIT;
