# Session lifetime ও dashboard loading

## Deploy করার ধাপ

1. চলমান live exam নেই এমন সময়ে update দিন। নতুন session policy পুরোনো login-এর আসল বয়স থেকেও হিসাব করে; পুরোনো session-এর user-কে আবার login করতে হতে পারে।
2. Supabase SQL Editor-এ প্রথমে `supabase/014_session_lifetime.sql`, তারপর `supabase/015_dashboard_loading.sql` চালান। আগে 005–009, 011–013 applied থাকতে হবে। 010 cron setup আগের মতো রাখতে হবে। নতুন SQL দুইটি repeatable; content/user delete করে না। পুরোনো migration আবার চালাবেন না।
3. এই ZIP-এর code দিয়ে বর্তমান code update করুন। নিজের `.env.local` রাখুন। নতুন ENV, dependency বা service-role key লাগবে না।
4. `npm install` → `npm run build` → deploy। নতুন code ব্যবহারের আগে SQL দুটো চালানো প্রয়োজন।
5. একবার logout/login করুন। Dashboard, প্রশ্ন search/page, bookmarks, practice, পুরোনো result, admin এবং ছোট test live exam যাচাই করুন।

## Session কীভাবে কাজ করে

- Supabase SDK আগের মতো access/refresh token তৈরি, refresh ও rotation করে। নতুন কোনো token system বা service-role browser-এ দেওয়া হয়নি।
- Student: Auth session তৈরি হওয়ার ৭ দিন পরে; admin: ১২ ঘণ্টা পরে app access বন্ধ। Activity বা token refresh এই deadline বাড়ায় না। এটি inactivity timeout নয়।
- `auth.jwt().session_id` দিয়ে `auth.sessions`-এর user ও original `created_at` মেলানো হয়। Server clock, active profile এবং native `not_after`-ও মানে। Session মুছে গেলে অবশিষ্ট JWT-তেও app data পাওয়া যায় না। Auth tables পরিবর্তন/মুছে দেওয়া হয় না।
- Secured RPC helpers এবং বিদ্যমান Aarohon tables-এর restrictive RLS policy দিয়ে database-এ enforcement। শুধু JS timer বা cookie expiry নয়। Browser থেকে সরাসরি table/RPC call করলেও পরীক্ষা হয়। নতুন protected table/RPC ভবিষ্যতে যোগ করলে একই policy/helper লাগাতে হবে।
- এটি Free plan-এর **app-level access policy**। Supabase Auth নিজে expired app session-এর token refresh করতে পারলেও Aarohon data access প্রত্যাখ্যান করবে। Browser expiry শনাক্ত হলে ওই device-এর local-scope sign-out করে; অন্য device logout করায় না।
- Protected page-এ deadline timer, focus check ও মিনিটে ছোট session-status check আছে। Network error-কে ভুল করে expiry ধরা হয় না। Background/sleep থাকা tab ফেরত এলে UI update হয়; database deadline তখনও বহাল।
- Exam start-এ পুরো পরীক্ষার deadline + ৫ মিনিট session-এ বাকি থাকা চাই। না থাকলে আগে logout/login করতে বলে; attempt তৈরি হয় না। Account suspension, role change, explicit logout বা revocation-এর বিরুদ্ধে exam exception নেই। Migration চলাকালে আগে শুরু করা exam-এর জন্যও exception নেই, তাই deployment সময়ের নির্দেশনা মানুন।
- আগে তৈরি PDF signed URL তার নিজস্ব সর্বোচ্চ ৬০ সেকেন্ড মেয়াদ পর্যন্ত চলতে পারে। আগে download হওয়া content ফেরত নেওয়া যায় না।

## Loading পরিবর্তন

- Dashboard RPC প্রথমেই সব প্রশ্ন/options/explanation আর তৈরি বা পাঠায় না।
- প্রশ্ন ব্যাংক, bookmarks ও mistakes: server search/filter এবং প্রতি পৃষ্ঠায় ২০টি প্রশ্ন। Search debounce ও stale response protection আছে।
- Practice button বর্তমান পৃষ্ঠার সর্বোচ্চ ২০টি প্রশ্ন দিয়ে session শুরু করে; button-এ এই আচরণ লেখা আছে।
- Result dialog খুললে ব্যাখ্যা পৃষ্ঠা ধরে আনে। Unreleased live answers-এর access check বজায় আছে।
- বিষয়ভিত্তিক statistics শুধু analytics খোলার পরে server aggregate থেকে আসে। Browser-এ প্রতিটি render-এ nested question lookup বাদ।
- Resume check-এ চলমান পরীক্ষা না থাকলে দ্বিতীয়বার পুরো dashboard ফেরত আসে না।
- Dashboard-এ ব্যবহার না হওয়া legacy leaderboard aggregate বাদ; আলাদা leaderboard page আগের secured RPC ব্যবহার করে।
- Role মূল dashboard response-এ থাকে। অতিরিক্ত profile query ও dashboard service-এর duplicate Auth roundtrip বাদ; Supabase Data API JWT validate করে এবং RPC database session/profile যাচাই করে। Proxy refresh বহাল।
- এখনও course/exam metadata, released attempt history ও notifications মূল payload-এ থাকে। অনেক বছরের attempt/history হলে পরবর্তী optimization লাগতে পারে; সব data source সীমিত করা হয়েছে এমন দাবি নয়।
- Server dashboard fetch ১.৫ সেকেন্ড ছাড়ালে `[aarohon:dashboard]` ও `totalMs` log হয়। User ID, email, token বা প্রশ্ন log হয় না। Production-এ ধীর হলে এই timing এবং browser Network response time তুলনা করুন।

## যাচাই

- Production build/TypeScript এবং ESLint।
- Local PGlite: session/RLS/pagination/answer-release checks; live lock, autosave, resume, focus rules, deadline scoring regression। ফলাফল `supabase/SESSION-DASHBOARD-VALIDATION.json` ও `SESSION-EXAM-VALIDATION.json`-এ। JSON শুধু test report, SQL Editor-এ চালাতে হবে না।
- Synthetic fixture (৪৬টি accessible প্রশ্ন, ১টি practice attempt): dashboard JSON ১১,৯০১ থেকে ২,৯৬৩ characters হয়েছে। এটি production speed বা database benchmark নয়।
- Real hosted Supabase, Google login, mobile/browser expiry ও live production latency এই পরিবেশে পরীক্ষা করা হয়নি।

Reference: https://supabase.com/docs/guides/auth/sessions
