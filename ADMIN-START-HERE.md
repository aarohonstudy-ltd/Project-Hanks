# Aarohon Admin Panel — চালু করার নিয়ম

## আগে যা করবেন

1. আগের project-এর backup রাখুন। এই ZIP extract করে `aarohon` folder খুলুন।
2. আগের `.env.local` নতুন project folder-এ কপি করুন। না থাকলে `.env.example` কপি করে `.env.local` করুন। Public URL/key আগে থেকে দেওয়া আছে। Service role key লাগবে না।
3. আপনার নতুন Supabase project-এর SQL Editor-এ `supabase/006_admin_panel.sql` পুরোটা paste করে Run দিন।
   - আগের `001_setup.sql` ও `005_dashboard_runtime.sql` চালানো থাকলে শুধু 006 চালাবেন।
   - 005 এখনও না চালালে আগে 005, তারপর 006। 001 আবার চালাবেন না।
   - 006 user/content মুছে না; আবার চালানো যায়। পরে 005 পুনরায় চালালে 006-ও পুনরায় চালাবেন।
4. Google/email দিয়ে অন্তত একবার signup/login করে নিজের Auth account তৈরি করুন।
5. `supabase/004_make_admin.sql` খুলে `REPLACE_WITH_YOUR_LOGIN_EMAIL`-এর জায়গায় নিজের login email দিন। তারপর SQL Editor-এ চালান। Email আগে থেকে বদলে থাকলে এবং admin role সেট থাকলে এই ধাপ লাগবে না।
6. Terminal-এ চালান:

```bash
npm ci
npm run dev
```

7. http://localhost:3000/admin খুলুন। নতুন login-এর পরে admin account স্বয়ংক্রিয়ভাবে /admin-এ যাবে। Student portal-এর header-এও Admin link থাকবে। আগে থেকে login থাকলে refresh করুন।

যদি “Admin অনুমতি প্রয়োজন” আসে, Supabase `profiles` table-এ আপনার account-এর role `admin` ও status `active` কি না দেখুন। অন্য email দিয়ে login করা আছে কি না মিলিয়ে নিন।

## কী কী আছে

| প্যানেল | কাজ |
| --- | --- |
| সারসংক্ষেপ | শিক্ষার্থী, published courses/questions/exams, pending requests ও submitted exams-এর সংখ্যা |
| কোর্স | তৈরি/সম্পাদনা, slug, মূল্য/অফার, description, subjects এবং draft/published/archived |
| বিষয় ও টপিক | question bank সাজানোর জন্য বিষয়/টপিক তৈরি ও নাম সম্পাদনা |
| লেসন | course lesson, লেখা, embedded YouTube / HTTPS video, private PDF upload, অধ্যায়, duration, position, publication status |
| প্রশ্ন ব্যাংক | 2–8 options, সঠিক উত্তর, ব্যাখ্যা, topic, difficulty ও publication status |
| পরীক্ষা | প্রশ্ন খুঁজে যোগ/সরানো/ক্রম বদলানো, marks/negative marks, duration, free/paid, schedule |
| এনরোলমেন্ট | pending request approve/reject; approval-এ course access যুক্ত হয় |
| শিক্ষার্থী | account খোঁজা, non-admin account suspend/activate |
| ফলাফল | exam attempts ও server-graded marks দেখা; read-only |
| অ্যাক্টিভিটি লগ | প্যানেল দিয়ে করা সফল পরিবর্তনের actor, action ও record ID |

প্রতি তালিকায় 25টি record; সার্চ ও pagination আছে। Desktop/mobile layout ও light/dark theme রাখা হয়েছে। প্রতিটি বিভাগ `src/components/admin/sections/`-এ আলাদা ফাইল।

## প্রথম কনটেন্ট তৈরি

1. বিষয় → যেমন “গণিত”।
2. টপিক → গণিতের অধীনে “বীজগণিত”।
3. কোর্স → নাম, ইংরেজি slug, দাম এবং বিষয় দিন। Free হলে দাম 0। Published করুন।
4. লেসন → কোর্স বেছে title/content দিন। একই course-এ position আলাদা হতে হবে। Published করুন।
5. প্রশ্ন ব্যাংক → topic বেছে প্রশ্ন লিখুন। প্রতি লাইনে একটি option। সঠিক option-এর নম্বর 1 থেকে শুরু। Published করুন।
6. পরীক্ষা → title/type/duration দিন; “প্রশ্ন খুঁজুন” দিয়ে published প্রশ্ন যোগ করুন। Marks ও deduction দিন। Published করুন।
7. একটি student account দিয়ে course/exam যাচাই করুন। Admin account-ও student portal দেখতে পারে, তবে paid enrollment rules একই থাকে।

## পরীক্ষার সময় ও ফলাফল

- Editor-এর সব সময় বাংলাদেশ সময় (UTC+6); server-এ UTC timestamp save হয়।
- Live exam-এ start/end দুটোই দিন। ফল/উত্তর প্রকাশের সময় exam end-এর আগে হতে পারবে না।
- Live পরীক্ষার জন্য আগে প্রকাশ না করা নতুন question ব্যবহার করুন। আগে কেউ দেখা question গোপন করা সম্ভব নয়।
- Published পরীক্ষায় থাকা question এবং practice/attempt-এ ব্যবহৃত question লক থাকে। সংশোধনের জন্য নতুন question বানান।
- Exam attempt থাকলে তার প্রশ্ন/marks/schedule edit করা যাবে না। নতুন exam তৈরি করুন।
- Active attempt শেষ হলে locked exam archive করা যাবে। পুরোনো result মুছবে না।
- Exam answers autosave, resume ও auto-submit যুক্ত হয়েছে। LIVE-EXAM-START-HERE.md অনুযায়ী 009 + 010 চালান।

## Approval ও নিরাপত্তা

- Paid enrollment approve করার আগে payment আলাদাভাবে যাচাই করুন। এই action শুধু course access দেয়; payment record বা payment gateway transaction তৈরি করে না।
- Approve/reject atomic; একই request দ্বিতীয়বার review করা যায় না।
- Admin access server এবং database RPC—দুই জায়গায় যাচাই হয়। Student/anonymous account admin API ব্যবহার করতে পারে না।
- Account suspension ব্যক্তিগত data ও mutations বন্ধ করে। আগে থেকে browser-এ দেখা data মুছে দিতে পারে না।
- Admin account suspend বা role বদলানোর UI নেই; role SQL Editor থেকে নিয়ন্ত্রণ করুন।
- Content hard delete নেই। Course/lesson/question-এর publication status ব্যবহার করুন; ব্যবহৃত exam/question lock প্রযোজ্য।
- Panel-এর পরিবর্তন audit log-এ থাকে; SQL Editor-এর সরাসরি পরিবর্তন এর মধ্যে পড়ে না।

## বর্তমান সীমা

Public homepage ও student dashboard প্রকাশিত course/content ব্যবহার করে। Course image upload এবং question CSV batch import যুক্ত হয়েছে; HOME-CSV-START-HERE.md অনুযায়ী 008 SQL চালান। Payment gateway, payment reconciliation, video file upload, role management, automated reminder delivery ও notification sending এই সংস্করণের অংশ নয়। Video-এর HTTPS link দেওয়া যায়; file hosting আলাদা।

## যাচাই

- Production build, TypeScript ও ESLint passed।
- Local PGlite PostgreSQL-compatible engine-এ admin-এর 34টি database/permission check passed।
- Local Next.js + mock Supabase HTTP দিয়ে 11টি admin section server rendering ও 3টি auth redirect check passed।
- Hosted Supabase/OAuth, browser click-through এবং mobile visual rendering end-to-end পরীক্ষা করা হয়নি।
- Reports: `supabase/ADMIN-VALIDATION.json`, `supabase/ADMIN-HTTP-VALIDATION.json`।

Classroom ও PDF upload-এর জন্য COURSE-START-HERE.md অনুযায়ী 011 SQL চালান।
