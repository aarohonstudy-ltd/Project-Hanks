# Completed exam button update

আগের `Aarohon-Mobile-Exam-Fix.zip` থেকে পরিবর্তিত/নতুন files:

- `supabase/018_exam_completed_cards.sql`
- `src/lib/student/types.ts`
- `src/components/student/cards/exam-card.tsx`
- `src/components/student/dashboard-context.tsx`
- `CHANGED-FILES.md`

প্রথমে Supabase SQL Editor-এ 018_exam_completed_cards.sql চালান (017-এর পরে)। তারপর code deploy করুন।
Submitted/expired exam-এ disabled «পরীক্ষা দেওয়া হয়েছে» button, ফলাফল প্রকাশের আগেও। চলমান attempt completion হিসেবে গণনা হয় না; practice আবার দেওয়া যাবে। Backend-এর আগের repeat-attempt restriction বহাল।
