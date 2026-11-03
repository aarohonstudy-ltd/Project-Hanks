-- OPTIONAL. Run after 001, on development only. No users or payments are seeded.
-- Idempotent: does not overwrite existing content. All demo IDs start with a1000000.
BEGIN;
INSERT INTO public.subjects(id,name) VALUES('a1000000-0000-4000-8000-000000000001','Demo Mathematics') ON CONFLICT DO NOTHING;
INSERT INTO public.topics(id,subject_id,name) VALUES('a1000000-0000-4000-8000-000000000002','a1000000-0000-4000-8000-000000000001','Demo Arithmetic') ON CONFLICT DO NOTHING;
INSERT INTO public.courses(id,slug,title,description,price,status) VALUES
('a1000000-0000-4000-8000-000000000003','aarohon-demo','আরোহণ ডেমো কোর্স','Development sample only',0,'published') ON CONFLICT DO NOTHING;
INSERT INTO public.course_subjects(course_id,subject_id) VALUES('a1000000-0000-4000-8000-000000000003','a1000000-0000-4000-8000-000000000001') ON CONFLICT DO NOTHING;
INSERT INTO public.lessons(id,course_id,topic_id,title,content,position,is_preview,status) VALUES
('a1000000-0000-4000-8000-000000000004','a1000000-0000-4000-8000-000000000003','a1000000-0000-4000-8000-000000000002','যোগের অনুশীলন','দুটি সংখ্যাকে একসঙ্গে যোগ করা শিখুন।',1,true,'published') ON CONFLICT DO NOTHING;
INSERT INTO public.questions(id,topic_id,question_text,explanation,status) VALUES
('a1000000-0000-4000-8000-000000000005','a1000000-0000-4000-8000-000000000002','২ + ৩ = কত?','২-এর সঙ্গে ৩ যোগ করলে ৫ হয়।','published') ON CONFLICT DO NOTHING;
INSERT INTO public.question_options(id,question_id,option_text,position) VALUES
('a1000000-0000-4000-8000-000000000006','a1000000-0000-4000-8000-000000000005','৪',1),
('a1000000-0000-4000-8000-000000000007','a1000000-0000-4000-8000-000000000005','৫',2),
('a1000000-0000-4000-8000-000000000008','a1000000-0000-4000-8000-000000000005','৬',3),
('a1000000-0000-4000-8000-000000000009','a1000000-0000-4000-8000-000000000005','৭',4) ON CONFLICT DO NOTHING;
INSERT INTO public.question_answer_keys(question_id,correct_option_id) VALUES('a1000000-0000-4000-8000-000000000005','a1000000-0000-4000-8000-000000000007') ON CONFLICT DO NOTHING;
INSERT INTO public.exams(id,course_id,title,duration_minutes,is_free,status) VALUES
('a1000000-0000-4000-8000-000000000010','a1000000-0000-4000-8000-000000000003','ডেমো মডেল টেস্ট',10,true,'published') ON CONFLICT DO NOTHING;
INSERT INTO public.exam_questions(exam_id,question_id,position) VALUES('a1000000-0000-4000-8000-000000000010','a1000000-0000-4000-8000-000000000005',1) ON CONFLICT DO NOTHING;
COMMIT;
