# Supabase integration — এখন যা করবেন

এই ZIP-এ Google ও email/password login, signup, logout, protected dashboard, profile,
bookmarks, free course enrollment, paid enrollment requests, lesson progress,
server-side exam/practice grading, results, notifications, reminder records ও real leaderboard যুক্ত আছে।
কোনো পুরোনো user import করা হয়নি। Public homepage এখন backend-এর প্রকাশিত কোর্স, পরিসংখ্যান ও preview lesson দেখায়। Course image ও প্রশ্ন CSV import-এর জন্য HOME-CSV-START-HERE.md অনুসরণ করুন।

## ১. Project খুলুন
আগের code-এর backup রাখুন। ZIP extract করে `aarohon` folder VS Code-এ খুলুন।
এই folder-এই package.json আছে। পুরোনো node_modules/.next কপি করবেন না।

## ২. নতুন SQL চালান
আপনার নতুন project `uqlncldoqmagflwiikkx`-এ Supabase Dashboard → SQL Editor → New query।
`supabase/005_dashboard_runtime.sql`-এর সম্পূর্ণ content paste করে Run দিন।
এটি আগে দেওয়া `001_setup.sql` দিয়ে তৈরি schema-এর উপরে যোগ হবে।
পুরোনো `001_setup.sql` আবার চালাবেন না। 005 বিদ্যমান user/content reset করে না এবং আবার চালানো যায়।
এই migration আমি আপনার hosted project-এ চালাইনি; local PostgreSQL-compatible engine-এ পরীক্ষা করেছি।

## ৩. Environment file
Project root-এ `.env.example` কপি করে `.env.local` নাম দিন। আপনার দেওয়া URL ও publishable key বসানো আছে।
ফাইলের নাম `.env.local.txt` যেন না হয়। এই integration-এ SUPABASE_SERVICE_ROLE_KEY লাগবে না।

macOS/Linux terminal:
```bash
cp .env.example .env.local
```
Windows PowerShell:
```powershell
Copy-Item .env.example .env.local
```

## ৪. Auth configuration যাচাই
Supabase → Authentication → URL Configuration:
- Site URL: http://localhost:3000
- Redirect URLs: http://localhost:3000/auth/callback

Google Cloud OAuth Web client-এর Authorized redirect URI:
https://uqlncldoqmagflwiikkx.supabase.co/auth/v1/callback

এটি Supabase callback; localhost callback Google Cloud-এ বসাবেন না।
Google provider আপনি আগেই configure করেছেন; নতুন করে client বানানোর প্রয়োজন নেই।
Google OAuth app Testing mode-এ থাকলে নিজের Gmail-টি Test users-এ যোগ করুন।
Email/password চাইলে Email provider enable রাখুন। Confirm email চালু থাকলে signup-এর পরে
ইমেইলের link একই browser-এ খুলুন। Production email delivery-এর জন্য SMTP configure করুন।

## ৫. চালু করুন
Node.js 22 LTS বা নতুন compatible version ব্যবহার করুন। Project terminal-এ:
```bash
npm ci
npm run dev
```
http://localhost:3000/login খুলে Google দিয়ে লগইন করুন। Email account-এর জন্য /register খুলুন।
অন্য local port হলে Supabase redirect URL-ও সেই port অনুযায়ী যোগ করতে হবে।

## ৬. নিজের account দিয়ে পরীক্ষা করুন
- Login-এর পরে /dashboard খুলবে। Profile-এ নাম/লক্ষ্য save করে refresh করুন।
- Supabase Authentication → Users-এ account এবং Table Editor → profiles-এ matching row দেখবেন।
- DB-তে published content থাকলে কোর্স/প্রশ্ন/পরীক্ষা দেখা যাবে। Empty database হলে তালিকা ফাঁকা থাকা স্বাভাবিক।
- আগের optional `002_optional_demo_content.sql` চালানো থাকলে free sample course ও exam দিয়ে পরীক্ষা করুন।
- Bookmark, free enrollment, lesson completion, exam submission করে refresh-এ data থাকে কি না দেখুন।
- Logout করে /dashboard খুললে /login-এ ফেরত যাবে।
- Student login-এর জন্য admin হওয়া প্রয়োজন নেই। Admin চাইলে signup-এর পরে আগের
  `004_make_admin.sql`-এ নিজের আসল email বসিয়ে চালাতে হবে। Admin panel যুক্ত হয়েছে; ADMIN-START-HERE.md অনুযায়ী 006 SQL চালিয়ে /admin খুলুন।

## ৭. Deploy করার সময়
Hosting-এর environment settings-এ `.env.example`-এর দুটি variable দিন এবং rebuild/redeploy করুন।
Supabase Site URL-এ আসল domain দিন; Redirect URLs-এ https://YOUR_DOMAIN/auth/callback যোগ করুন।

## বর্তমান সীমা
- Paid course request /admin/requests থেকে approve/reject করা যায়; payment gateway নেই।
- Reminder record save হয়; automated email/push sender যুক্ত হয়নি।
- Referral code ও stored count আছে; signup attribution/rewards flow পরে লাগবে।
- Live/model exam-এ autosave ও resume আছে। 009 + 010 সেটআপের পরে সময় শেষে সংরক্ষিত উত্তর দিয়ে score হবে; দেরিতে আসা উত্তর গ্রহণ হবে না। Practice আলাদা manual-submit flow।
- লাইভ পরীক্ষা একবার; model/practice আবার দেওয়া যায়। Practice-এ একবারে সর্বোচ্চ 100 প্রশ্ন।
- পরীক্ষার question/options/marks/keys attempt শুরু হওয়ার পরে edit করবেন না; content snapshot/versioning নেই।
- Scheduled/live exam-এ ব্যবহৃত প্রশ্ন release-এর আগে question bank থেকে লুকানো হয়।
  আগে প্রকাশিত question কেউ দেখে থাকলে তা ফিরিয়ে নেওয়া যায় না; live-এর জন্য নতুন question রাখুন।
- ফল প্রকাশের আগে analytics-এ সেই attempt দেখা যাবে না। সময় পার হলে page refresh করুন।
- Auth callback ব্যর্থ হলে /login থেকে আবার চেষ্টা করুন; URL configuration ও Google test users পরীক্ষা করুন।

## যাচাই
Production build, TypeScript ও ESLint পরীক্ষা করা হয়েছে। SQL-এর 21টি আচরণ/access-control check
local PGlite PostgreSQL-compatible engine-এ passed; রিপোর্ট `supabase/RUNTIME-VALIDATION.json`।
Hosted Google login, email delivery ও আপনার live database-এ end-to-end test এখনও করা হয়নি।
