# হোমপেজ, কোর্সের ছবি ও CSV Import

এটি আপনার বর্তমান Supabase-সংযুক্ত project-এর update। পুরোনো account বা database reset করার দরকার নেই। নিচের ধাপগুলো অনুসরণ করুন।

## ১. নতুন SQL চালান

আপনার বর্তমান Supabase project → SQL Editor → New query খুলুন। এই ZIP-এর `supabase/008_home_images_csv.sql` ফাইলের পুরো লেখা paste করে Run করুন।

আগের `005_dashboard_runtime.sql`, `006_admin_panel.sql` এবং `007_exam_leaderboard.sql` চালানো থাকতে হবে। এগুলো আগে চালানো থাকলে এখন **শুধু 008** চালাবেন। `001_setup.sql` আবার চালাবেন না। 008 আবার চালালেও existing content reset হয় না।

008 যা যোগ করে:

- Public homepage-এর জন্য প্রকাশিত কোর্স, প্রকৃত পরিসংখ্যান ও অনুমোদিত preview lesson-এর data।
- `course-images` Storage bucket: JPG, PNG ও WebP, সর্বোচ্চ 5 MB। কভার সবার দেখার জন্য public; upload শুধু active admin করতে পারে।
- Course save ও student dashboard-এ thumbnail support।
- Admin-only batch import এবং original question ID/metadata ধরে রাখার private table।
- Imported প্রশ্নে নির্ধারিত কোর্স অনুযায়ী access; একই subject অন্য কোর্সে থাকলেই imported প্রশ্ন সেখানে প্রকাশিত হবে না। Free published exam-এ ব্যবহার করলে সে পরীক্ষার access অনুযায়ী পাওয়া যাবে।

## ২. Code update ও deploy

ZIP extract করে ভিতরের `aarohon` folder-এর updated files আপনার project-এ নিন। আপনার কাজ করা `.env.local` রাখুন। ZIP-এ `.env.local`, `node_modules` বা `.next` নেই।

```bash
npm ci
npm run dev
```

Local কাজ দেখা শেষে code push করে hosting-এ নতুন deployment দিন। Production environment-এ আগের দুই variable একই রাখুন:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

এই feature-গুলোর জন্য `SUPABASE_SERVICE_ROLE_KEY` প্রয়োজন নেই।

## ৩. কোর্সে ছবি দিন

1. Admin হিসেবে login → `/admin/courses`।
2. নতুন কোর্স অথবা সম্পাদনা খুলুন।
3. **কোর্সের কভার ছবি** থেকে JPG/PNG/WebP upload করুন; অথবা HTTPS image URL দিন।
4. Upload ও preview শেষ হতে দিন। দাম, description ও প্রয়োজনীয় বিষয় ঠিক করুন।
5. Status **Published** করে **সংরক্ষণ করুন**।
6. হোমপেজ refresh করুন। একই ছবি student dashboard-এর course card-এও দেখা যাবে।

ছবি না দিলে সাধারণ cover থাকবে। ছবি বদলালে নতুন file upload হয়; আগের image স্বয়ংক্রিয়ভাবে delete হয় না, যাতে অন্য কোথাও ব্যবহার হলে ভেঙে না যায়। কভার সরালে course-এর link মুছে যায়।

## ৪. আপনার প্রশ্নের CSV Import করুন

আপনার দেওয়া `question_bank_rows.csv` সরাসরি ব্যবহার করা যাবে। এতে **৪,০৪৪টি প্রশ্ন ও ৬টি source course** পাওয়া গেছে। পুরো ফাইল লোকাল validation এবং পরীক্ষামূলক database import-এ সঠিকভাবে পড়েছে। আপনার hosted database-এ এখনো import করা হয়নি।

1. `/admin/questions` → **CSV Import**।
2. `question_bank_rows.csv` নির্বাচন করুন। UI-তে মোট প্রশ্ন, ত্রুটি ও প্রথম প্রশ্নের উত্তরসহ preview দেখবেন।
3. প্রতিটি পুরোনো কোর্সের পাশে একটি option বেছে নিন:
   - **এই নামে নতুন Draft কোর্স তৈরি করুন**: নতুন course তৈরি হবে।
   - বিদ্যমান course-এর নাম: প্রশ্ন সেই course-এ যাবে।
   - **এই কোর্সের প্রশ্ন বাদ রাখুন**: এই import-এ সেই source course-এর প্রশ্ন আসবে না।
4. ফাইলে `test`-এর ১০টি ও `টেস্ট কোর্স`-এর ২টি প্রশ্ন আছে। এগুলো প্রয়োজন না হলে ওই দুই কোর্সে **বাদ রাখুন** বেছে নিন। চারটি মূল কোর্স রাখলে মোট **৪,০৩২টি** প্রশ্ন import হবে।
5. প্রশ্ন প্রস্তুত থাকলে **Published — ব্যবহার করার জন্য প্রস্তুত** নিন। আগে আলাদা করে যাচাই করতে চাইলে **Draft** রাখুন। Draft প্রশ্ন ছাত্রদের কাছে বা exam question picker-এ আসবে না; পরে প্রশ্ন ব্যাংক থেকে সম্পাদনা করে Publish করতে হবে।
6. **প্রশ্ন Import করুন** চাপুন। প্রক্রিয়া শেষ হওয়া পর্যন্ত tab খোলা রাখুন। ছোট ব্যাচে progress দেখাবে; ফাইল নিজে ভাগ করতে হবে না।
7. নতুন তৈরি course-গুলো `/admin/courses`-এ গিয়ে দাম, ছবি ও description ঠিক করে Publish করুন। নতুন course প্রথমে Draft ও দাম 0 থাকে; paid course হলে Publish করার আগে দাম ঠিক করুন।
8. Student account-কে course access দিয়ে `/dashboard/questions` ও practice যাচাই করুন। CSV import থেকে পরীক্ষা তৈরি হয় না; `/admin/exams` থেকে imported Published প্রশ্ন দিয়ে পরীক্ষা তৈরি করতে পারবেন।

একই subject ও topic আগে থাকলে তা reuse হয়; না থাকলে তৈরি হয়। `topic`-এ `>`-সহ পূর্ণ path একটি topic name হিসেবে রাখা হয়। পুরোনো question ID, `created_at`, `is_master`, source course ও content private import record-এ থাকে। পুরোনো user account আনা হয় না।

### আবার Import করলে

- একই source `id` আবার এলে নতুন প্রশ্ন হবে না। Existing question, answer বা status overwrite হবে না।
- মাঝপথে connection বন্ধ হলে বা **থামান** চাপলে সফল ব্যাচগুলো থেকে যাবে। একই file ও একই course mapping দিয়ে আবার চালান।
- একটি ব্যাচে ভুল থাকলে ওই ব্যাচের কোনো প্রশ্ন save হবে না; আগের সফল ব্যাচ থাকবে।
- একই ID-এর content পাল্টে এলে UI changed count দেখায়; আগের প্রশ্ন edit করতে প্রশ্ন ব্যাংক ব্যবহার করুন।
- আগের ID অন্য course-এ remap করতে গেলে import থামবে। নতুন ID দিয়ে duplicate বানিয়ে সমস্যাটি এড়াবেন না; আগে সঠিক course mapping মিলিয়ে নিন।

### CSV format

প্রয়োজনীয় header: `id,q,opts,correct,exp,topic,subject,course,created_at,is_master`।

- `id`: unique UUID।
- `q`: প্রশ্নের লেখা।
- `opts`: JSON string array, যেমন `["ঢাকা","চট্টগ্রাম","খুলনা","রাজশাহী"]`। সাধারণ CSV quoting বজায় রাখুন।
- `correct`: **0 থেকে শুরু**। `0` = প্রথম option, `1` = দ্বিতীয়, `2` = তৃতীয়, `3` = চতুর্থ। Admin-এর হাতে প্রশ্ন তৈরির form-এ নম্বর 1 থেকে শুরু হয়; importer নিজে conversion সামলায়।
- `exp`: ব্যাখ্যা; খালি রাখা যায়।
- `topic`, `subject`, `course`: নাম।
- `created_at`: বৈধ timestamp।
- `is_master`: `true` অথবা `false`; metadata হিসেবে থাকে, অতিরিক্ত public access দেয় না।

UTF-8 CSV ব্যবহার করুন। Quoted comma, Bengali text, multiline explanation, double quote ও BOM supported। একটি ফাইলে সর্বোচ্চ 10,000 প্রশ্ন / 20 MB; একটি প্রশ্নে 2–8টি option। Validation error থাকলে UI import শুরু করবে না।

## ৫. হোমপেজ এখন কী দেখায়

- Admin-এর **Published** কোর্স, cover, description, offer/regular price এবং Published lesson count। Draft/Archived course দেখাবে না।
- Active student account count, Published question count এবং submitted/expired exam attempt count।
- `/admin/lessons`-এ **Preview lesson** টিক দেওয়া Published lesson-এর HTTPS ভিডিও লিংক, যদি তার course-ও Published হয়। Homepage থেকে ভিডিও নতুন tab-এ খোলে। Video file upload এই update-এ নেই।
- কোর্সের enrollment button student course page-এ নিয়ে যায়। Existing free enrollment এবং paid request approval flow ব্যবহার হয়।
- সাধারণ FAQ static তথ্য; বানানো reviews আর দেখানো হয় না। Backend না পাওয়া গেলে ভুয়া demo data দেখানোর বদলে retry message আসে।

## যাচাই

Production build, TypeScript ও ESLint passed। ২৮টি CSV/database/permission check এবং ৮টি local Next HTTP/rendering check passed। সব ৪,০৪৪টি প্রশ্নের লেখা, ব্যাখ্যা ও সঠিক option মিলিয়ে দেখা হয়েছে। Report: `supabase/home-import-test-results.json`।

Tests-এ local PGlite ও mocked Supabase Auth/Storage ব্যবহার করা হয়েছে। আপনার hosted Supabase, Google login, actual Storage upload বা browser click-through এই পরিবেশ থেকে পরীক্ষা করা হয়নি।

Storage policy reference: https://supabase.com/docs/guides/storage/security/access-control
