# Live exam, practice feedback ও push notification

## ১. SQL চালান

আগের course/classroom setup (011 পর্যন্ত) রাখা অবস্থায় Supabase SQL Editor-এ এই ক্রমে চালান:

1. `supabase/012_exam_answer_feedback.sql`
2. `supabase/013_push_notifications.sql`

দুটিই additive ও repeatable। Existing users, enrollment, course, question ও results মুছবে না। আগের 001 বা seed চালাবেন না। নতুন migrations-এর পরে পুরোনো 005/008/009 চালালে পুরোনো function ফিরে আসতে পারে। পরিবর্তিত সব ফাইলের তালিকা `CHANGED-FILES.md`-এ আছে।

## ২. Push keys তৈরি করুন

Project folder-এ:

```bash
npm install
npx web-push generate-vapid-keys
```

কমান্ডের Public Key ও Private Key ব্যবহার করে `.env.local`-এ যোগ করুন:

```dotenv
NEXT_PUBLIC_VAPID_PUBLIC_KEY=YOUR_GENERATED_PUBLIC_KEY
VAPID_PRIVATE_KEY=YOUR_GENERATED_PRIVATE_KEY
VAPID_SUBJECT=mailto:YOUR_REAL_EMAIL
```

আগের Supabase URL ও publishable key রাখুন। Vercel → Project → Settings → Environment Variables-এ এই তিনটিও যোগ করুন, Production environment নির্বাচন করুন এবং নতুন deployment দিন। Public key build-এর সময় লাগে। Private key-তে `NEXT_PUBLIC_` prefix দেবেন না এবং git-এ রাখবেন না। এই feature-এ Supabase service-role key লাগবে না।

একবার তৈরি করা key pair নিরাপদে সংরক্ষণ করুন; redeploy-এর সময় নতুন key তৈরি করবেন না। Key বদলালে পুরোনো subscription unsubscribe করে আবার subscribe করতে হবে।

## ৩. Student notification চালু করবে

Student login → dashboard-এর bell icon → “Notification চালু করুন” → browser-এর Allow। প্রতিটি device/browser-এ আলাদাভাবে চালু করতে হবে। Permission browser settings-এ blocked থাকলে সেখানে Allow করতে হবে। Production-এ HTTPS প্রয়োজন; localhost development চলে। iPhone/iPad-এ সমর্থিত iOS version-এ site Home Screen-এ যোগ করে সেখান থেকে খুলে permission দিন।

Bell dialog থেকে বন্ধ করা যায়। Site-এর logout button browser subscription বন্ধ করে তারপর sign out করে। অন্য account দিয়ে একই device ব্যবহার করলে আবার চালু করুন। Browser push বন্ধ থাকলেও inbox-এর notification দেখা যাবে।

## ৪. Admin notification পাঠাবে

`/admin/notifications` → audience নির্বাচন:

- **সকল সক্রিয় শিক্ষার্থী**: active student accounts।
- **নির্দিষ্ট কোর্স**: ওই published কোর্সে active ও মেয়াদ না-শেষ-হওয়া enrollment আছে এমন শিক্ষার্থী।

শিরোনাম, বার্তা এবং নিজের site-এর path দিন, যেমন `/dashboard/live` অথবা `/dashboard/courses/COURSE_UUID`। বাইরের URL দেওয়া যাবে না। “Notification পাঠান” চাপলে inbox entry তৈরি হয় এবং opt-in করা device-এ push পাঠানো হয়। Audience সেই সময়ের snapshot; পরে ভর্তি হওয়া শিক্ষার্থী পুরোনো broadcast পাবে না। Delivery-এর আগে account/enrollment আবার যাচাই হয়।

পাঠানোর সময় page খোলা রাখুন। ছোট batch-এ পাঠানো হয়। Tab বন্ধ/connection interruption হলে queue থাকে; Admin page-এ “Pending push Resume করুন” চাপুন। Temporary failure-এ ৩০ সেকেন্ড পরে retry; interrupted batch-এর lease ছাড়তে ২ মিনিট লাগতে পারে। প্রতি device delivery সর্বোচ্চ ৩ বার চেষ্টা হয়। একবারে সর্বোচ্চ ১০০০ queued device process হয়; বাকি থাকলে Resume। এটি unattended scheduled campaign worker নয়।

Status-এ Inbox count, Push service accepted, Pending ও Failed/expired দেখা যায়। “Accepted” মানে push service নিয়েছে, শিক্ষার্থী পড়েছে এমন নয়। Browser/OS settings, permission ও internet-এর কারণে delivery দেরি বা ব্যর্থ হতে পারে। Network acknowledgement হারালে rare retry duplicate হতে পারে; notification tag একই campaign-এর visible notification replace করতে সাহায্য করে। Invalid/expired subscription বন্ধ হয়ে যায়; student আবার permission দিয়ে connect করতে পারবে।

## ৫. Exam-এর নতুন নিয়ম

### Live exam

- একবার option select করলে সেই প্রশ্নের সব option lock হয়।
- Server-এ প্রথম সংরক্ষিত উত্তর স্থায়ী; forged higher revision, reload বা অন্য device দিয়ে overwrite হয় না।
- Autosave, deadline, fullscreen, tab-switch warning ও আগের auto-submit নিয়ম বহাল।
- Live exam চলাকালে সঠিক উত্তর/ব্যাখ্যা দেখানো হয় না।

### Dashboard → Practice

- Fullscreen প্রয়োজন নেই; tab-switch penalty নেই।
- উত্তর দিলে server সঙ্গে সঙ্গে যাচাই করে। ভুল হলে ভুল চিহ্ন, সঠিক উত্তর ও ব্যাখ্যা; সঠিক হলে success এবং ব্যাখ্যা দেখায়।
- উত্তর যাচাইয়ের সময় final submit disabled থাকে।
- Feedback দেখার পর ওই practice session-এ উত্তর পরিবর্তন করা যায় না। আবার অনুশীলন করতে নতুন practice শুরু করুন।
- সঠিক উত্তর আগে client-এ পাঠানো হয় না; বাছাইয়ের পরে পাওয়া যায়। Live/অপ্রকাশিত প্রশ্নের access restriction মানা হয়।
- “উত্তর জমা দিন” চাপলে practice completed হয় ও results/activity update হয়।
- এই update আলাদা Practice section-এর জন্য। Timed free/model test আগের মতো final submission-এর পরে result দেখায়।

## ৬. নিজের site-এ পরীক্ষা

1. একটি test live exam-এ উত্তর দিন, আবার অন্য option ও reload দিয়ে দেখুন প্রথম উত্তরই থাকে।
2. Practice-এ একটি ভুল ও একটি সঠিক উত্তর দিন; feedback এবং final score দেখুন।
3. Test student account-এ notification Allow করুন। শুধু সেই test course-এর audience দিয়ে একটি test message পাঠান।
4. ওই কোর্সে unenrolled account যেন message না পায় যাচাই করুন।
5. App tab বন্ধ থাকলেও notification ও click destination নিজের Android/desktop-এ পরীক্ষা করুন।

Local production build, TypeScript ও lint পাশ করেছে। SQL/RLS, exam lock, practice feedback, notification audience, queue/lease/retry, HTTP routes এবং mocked push transport পরীক্ষা করা হয়েছে। VAPID signing/encryption real library দিয়ে locally যাচাই হয়েছে। আপনার hosted Supabase-এ SQL, real browser permission বা real-device delivery এই পরিবেশ থেকে পরীক্ষা/চালু করা হয়নি; কোনো বাস্তব শিক্ষার্থীকে test message পাঠানো হয়নি। Validation reports `supabase/*VALIDATION.json`-এ আছে।

Official reference: https://nextjs.org/docs/app/guides/progressive-web-apps
