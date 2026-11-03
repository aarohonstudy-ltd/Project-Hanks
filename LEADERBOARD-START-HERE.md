# নতুন পরীক্ষাভিত্তিক লিডারবোর্ড

1. আগের project backup রেখে নতুন ZIP extract করুন। নিজের .env.local নতুন folder-এ রাখুন।
2. আগের 005 ও 006 migration চালানো থাকলে Supabase SQL Editor-এ শুধু `supabase/007_exam_leaderboard.sql` চালান। 001 আবার চালাবেন না। ভবিষ্যতে 006 পুনরায় চালালে এরপর 007-ও চালাবেন।
3. `npm ci` ও `npm run dev` চালান। /dashboard/leaderboard খুলুন।
4. Admin → পরীক্ষা-তে এখন পাস নম্বর দেওয়া যায়। 0 হলে pass/fail-এর বদলে “সম্পন্ন” দেখায়। আগে attempt থাকা পরীক্ষা আগের মতো locked থাকবে।

ডিজাইন: বর্তমান cyan accent, shadcn controls, sidebar ও light/dark theme-এর সঙ্গে মিল রেখে hero, course/exam/subject search, top-three cards, নিজের rank summary, searchable table, pagination এবং print view যুক্ত আছে। Print-এ বর্তমান ফলাফলের পৃষ্ঠা ও ফিল্টার থাকবে; সব পৃষ্ঠা একসঙ্গে নয়।

প্রতি শিক্ষার্থীর সেরা submitted attempt রাখা হয়: score বেশি, তারপর কম সময়। একই score/time-এ একই rank। সময় server timestamp থেকে পূর্ণ সেকেন্ডে নেওয়া হয়। Expired/in-progress attempts অন্তর্ভুক্ত নয়। Active account-এর নাম, score, সময় ও status দেখায়; email/phone দেখায় না। Paid পরীক্ষার তালিকা enrolled account ও admin-ই দেখতে পায়। Scheduled/live exam শেষ এবং ফল প্রকাশের আগে leaderboard পাওয়া যায় না।

রেকর্ড না থাকলে নমুনা শিক্ষার্থী দেখায় না; empty state দেখায়। Filter বদলে dropdown থেকে পরীক্ষা নির্বাচন করুন।

যাচাই: production build, TypeScript, ESLint; local PGlite-এ 11 ranking/access checks passed। Report: supabase/LEADERBOARD-VALIDATION.json। Hosted Supabase login ও browser visual/click-through পরীক্ষা করা হয়নি।

আগের admin loading রিপোর্টের মূল কারণ আপনার terminal log ছাড়া নিশ্চিত হয়নি; এই leaderboard update সেটি ঠিক হয়েছে বলে দাবি করছে না।
