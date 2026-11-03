# আমার কোর্স ও ক্লাসরুম চালু করুন

## ১. নতুন SQL চালান

আপনার আগের Supabase project-ই ব্যবহার করুন। আগের data/user মুছতে বা নতুন database তৈরি করতে হবে না।

Supabase Dashboard → SQL Editor → New query → `supabase/011_course_classroom.sql`-এর পুরো লেখা paste → Run।

এটি আগের 005, 006, 007, 008 ও 009 migration চালানো আছে ধরে নেয়। আগের live exam setup থাকলে শুধু 011 চালালেই এই update হবে। 010 হলো exam cron setup; তা আগের মতো রাখুন। 001 setup বা optional demo SQL আবার চালাবেন না। Migration repeatable ও additive, existing course/lesson/enrollment রাখে।

011 যা করে: lesson-এ PDF path, অধ্যায়, duration যোগ; private `course-materials` bucket; admin upload ও enrolled student download access; classroom read RPC; admin lesson save-এর নতুন fields। 011-এর পরে পুরোনো 008 পুনরায় চালাবেন না—সেটি পুরোনো lesson-save function ফিরিয়ে দেবে।

## ২. কোড চালান / deploy করুন

ZIP-এর `aarohon` folder-এর updated source ব্যবহার করুন। নিজের `.env.local` এবং production environment variables রাখুন; এগুলো ZIP-এ নেই। `.env.example`-এ প্রয়োজনীয় public variable নাম আছে। Service-role key এই feature-এর জন্য দরকার নেই।

```bash
npm install
npm run dev
```

Production-এ updated code push/deploy করুন। পুরোনো `src/components/student/dialogs/lesson.tsx` আর ব্যবহৃত হয় না; source merge করলে এটি সরিয়ে দিন।

## ৩. Admin থেকে content দিন

1. `/admin/courses` → কোর্স তৈরি/সম্পাদনা → Published রাখুন।
2. `/admin/lessons` → নতুন লেসন → কোর্স নির্বাচন করুন।
3. নাম এবং ক্রম দিন। একই কোর্সে প্রতিটি position আলাদা হতে হবে। একই অধ্যায়ের লেসন পাশাপাশি ক্রমে রেখে একই অধ্যায়ের নাম দিন।
4. YouTube share/watch link দিন; Shorts/live/embed link-ও চলে। ভিডিওর দৈর্ঘ্য (মিনিট) ঐচ্ছিক।
5. PDF নোট upload করুন (সর্বোচ্চ 20 MB), অথবা পাঠের লেখা দিন। একই লেসনে ভিডিও + PDF + লেখা একসঙ্গে রাখা যায়।
6. লেসনের status Published → সংরক্ষণ করুন। Draft লেসন student দেখবে না।

YouTube video Public বা Unlisted এবং embedding enabled থাকতে হবে। Private বা embedding-disabled ভিডিও এই player-এ চলবে না। Player-এর নিচে মূল ভিডিওর fallback link আছে। YouTube-এর নিজস্ব controls/branding থাকে; এটি DRM নয়। HTTPS MP4/WebM/Ogg link-ও player-এ চলে। অন্য provider-এর জন্য link দেখাবে।

Preview lesson চিহ্নিত করলে published video homepage-এ সবার জন্য দেখা যাবে, সেখানেও embedded player আছে। PDF-এর access তবু enrolled শিক্ষার্থীর জন্যই।

PDF বদলালে নতুন file upload হয়। “PDF সরান” lesson থেকে attachment সরায়; পুরোনো Storage file স্বয়ংক্রিয়ভাবে মুছে যায় না। Shared file অন্য লেসনে লাগানো থাকলে সরাসরি Storage থেকে মুছবেন না।

## ৪. Student কী দেখবে

- `/dashboard/courses`: শুধু active, মেয়াদ না-শেষ-হওয়া enrollment-এর published কোর্স। Pending request এখানে দেখাবে না।
- `/dashboard/catalog`: সব published কোর্স; free enrollment বা paid enrollment request আগের নিয়মে। Paid request Admin-এর enrollment screen থেকে approve করুন।
- কোর্সে click: পূর্ণ classroom, অধ্যায়ভিত্তিক lesson list ও search।
- প্রথম অসম্পূর্ণ লেসন স্বয়ংক্রিয়ভাবে খুলবে; সব শেষ হলে প্রথম লেসন আবার দেখা যাবে।
- ভিডিও সাইটের ভেতরে চলে, PDF download হয়, লেখা পড়া যায়।
- “পড়া সম্পন্ন করুন” দিলে অগ্রগতি সংরক্ষিত হয়। ভিডিও দেখার সময় স্বয়ংক্রিয় completion নয়।
- আগের/পরের লেসন navigation এবং course completion progress আছে।
- এখনো lesson না থাকলে course খোলে ও empty state দেখায়।

## ৫. নিজের site-এ একবার পরীক্ষা করুন

একটি published test course-এ video, PDF ও text দিন। একটি student account enroll করে “আমার কোর্স” থেকে খুলুন। Video play, PDF download ও completion করে refresh করুন। অন্য unenrolled account দিয়ে একই course/PDF link খুলে access বন্ধ আছে দেখুন। ফোনেও ভিডিও চালিয়ে দেখুন।

Local যাচাই: production build, TypeScript, lint; 31 SQL/RLS/media-parser checks এবং 11 Next HTTP checks পাশ করেছে। Reports: `supabase/COURSE-VALIDATION.json`, `supabase/COURSE-HTTP-VALIDATION.json`। HTTP test-এ Supabase/Storage response mock করা হয়েছে; আপনার hosted database-এ migration, real upload এবং YouTube playback এই পরিবেশ থেকে পরীক্ষা করা হয়নি।

Reference: [YouTube embeds](https://developers.google.com/youtube/player_parameters), [Supabase signed downloads](https://supabase.com/docs/reference/javascript/file-buckets-createsignedurl)।
