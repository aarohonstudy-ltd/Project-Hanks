# Live Exam: autosave, fullscreen ও automatic submission

এই update আপনার homepage, course image ও CSV import-সহ আগের কাজগুলো রাখে। নতুন exam interface ব্যবহার করতে নিচের setup সম্পূর্ণ করুন। আগের `001`–`008` setup reset করার প্রয়োজন নেই।

## ১. Database update

Supabase → SQL Editor → New query → এই ZIP-এর `supabase/009_exam_autosave.sql` পুরোটা paste করে Run করুন। এটি additive ও repeatable।

যে পরিবর্তনগুলো হবে:

- প্রতিটি নির্বাচিত exam answer-এর autosave ও revision সংরক্ষণ।
- একই attempt resume; deadline, saved answers ও warning count অক্ষত।
- Live exam-এ প্রথম departure-এ warning, দ্বিতীয় departure-এ automatic submission।
- Server-side deadline check, saved-answer scoring ও negative marking।
- Duplicate request এবং পুরোনো autosave দিয়ে নতুন উত্তর overwrite ঠেকানো।
- নতুন tab/device থেকে Resume করলে আগের tab-এর write token আর কাজ করবে না।
- ফল প্রকাশের সময়ের আগে forced submission-এর score গোপন রাখা।
- Admin → ফলাফলে departure count এবং submission reason।

নতুন code-এ পুরোনো exam submit পথ ব্যবহার হয় না। চলমান আসল পরীক্ষা শেষ হওয়ার পরে update deploy করুন, যাতে পুরোনো interface-এর unsaved উত্তর হারিয়ে না যায়।

## ২. Browser বন্ধ থাকলেও submission চালু করুন — এই ধাপটি আবশ্যক

1. Supabase Dashboard → **Integrations → Cron** খুলুন।
2. **pg_cron** extension enable করুন।
3. SQL Editor-এ `supabase/010_exam_cron.sql` চালান।
4. Result-এ `aarohon-expire-exams` job-এর `active = true` আছে কি না দেখুন।

এই job প্রতি মিনিটে overdue attempt খুঁজে server-এ সংরক্ষিত উত্তর দিয়ে জমা করে। Browser বা application server চালু থাকার প্রয়োজন নেই। Job execution ও database load অনুযায়ী final result তৈরি হতে কিছুটা দেরি হতে পারে; সাধারণ অবস্থায় পরের minute-এর run-এ হবে। **উত্তর গ্রহণের deadline বাড়ে না।** Recorded finish time মূল deadline-ই থাকবে।

Job check:

```sql
SELECT jobid, jobname, schedule, active
FROM cron.job
WHERE jobname = 'aarohon-expire-exams';
```

Run history check:

```sql
SELECT status, return_message, start_time, end_time
FROM cron.job_run_details
WHERE jobid = (
  SELECT jobid FROM cron.job
  WHERE jobname = 'aarohon-expire-exams'
)
ORDER BY start_time DESC
LIMIT 10;
```

একই `010` আবার চালালে ওই job update হবে; duplicate job হবে না। Cron enable/run না করলে বন্ধ browser-এর attempt নিজে থেকে সময়মতো finalize হবে না; পরের exam request/Resume-এ overdue attempt finalize হবে।

## ৩. Code deploy

ZIP-এর `aarohon` folder-এর updated project deploy করুন। আপনার কাজ করা `.env.local` ও hosting environment variables রাখুন। নতুন কোনো secret/service-role key লাগবে না।

```bash
npm ci
npm run build
```

Local চালাতে `npm run dev`। Production-এ নতুন deployment দিন। পুরোনো খোলা browser tab reload করুন।

## ৪. শিক্ষার্থী কী দেখবে

1. Live exam-এর **পরীক্ষা শুরু করুন** চাপলে নিয়ম ও সম্মতির checkbox আসবে।
2. **Fullscreen-এ পরীক্ষা শুরু করুন** চাপলে fullscreen অনুমতি নেওয়া হবে; তারপর server-এ attempt শুরু হবে। Fullscreen অনুমতি না পেলে নতুন attempt শুরু হবে না।
3. উত্তর নির্বাচন করলে সঙ্গে সঙ্গে save request যাবে। **সব উত্তর সংরক্ষিত ✓** লেখা দেখলে server confirmation পাওয়া গেছে।
4. অন্য tab/app/window-এ গেলে, browser minimize করলে বা fullscreen ছাড়লে প্রথম warning আসবে। একই departure-এর একাধিক browser event একবার গণনা হয়।
5. ফিরে এসে **Fullscreen-এ পরীক্ষা চালিয়ে যান** চাপুন। দ্বিতীয় departure হলে saved/current submitted snapshot দিয়ে পরীক্ষা auto-submit হবে।
6. নিজের ইচ্ছায় জমা দেওয়ার জন্য **উত্তর জমা দিন → হ্যাঁ, জমা দিন**। Submit করার পরে আর উত্তর বদলানো যায় না।
7. সময় শেষ হলে inputs বন্ধ হবে; server-এ সময়ের মধ্যে পৌঁছানো উত্তর দিয়ে ফল তৈরি হবে। শুধু দেরিতে submit হয়েছে বলে আগের saved উত্তরকে শূন্য করা হবে না।

Live exam চলাকালে dialog-এর close button, outside click ও Escape দিয়ে dialog বন্ধ করা নিষ্ক্রিয়। Browser-এর নিজস্ব navigation/close বা OS-এর app switching ওয়েবসাইট পুরোপুরি আটকাতে পারে না। Refresh/back/close browser অনুসারে departure হিসেবে ধরা পড়তে পারে।

## ৫. Refresh, reconnect ও অন্য device

- `/dashboard`-এ ফিরে login করলে চলমান exam নিজে থেকে পাওয়া যাবে। Fullscreen-এ Resume করুন।
- আগের deadline ও warning count চলবে; নতুন attempt বা নতুন সময় দেওয়া হবে না।
- Latest tab/device-এ Resume করলে আগের tab-এ write বন্ধ হবে। আগের tab error দেখালে নতুন tab-এ চালিয়ে যান, অথবা সেই পেজ reload করে আবার Resume করুন।
- সংযোগ না থাকলে local pending answer রাখা ও retry করার চেষ্টা হয়। Server-এ না পৌঁছানো উত্তর save হয়েছে বলে দেখানো হবে না। Deadline পার হওয়ার পরে নতুন offline answer গ্রহণ হবে না।
- Departure event পাঠানো best-effort। Offline অবস্থায় দ্বিতীয় departure হলে UI উত্তর দেওয়া বন্ধ করে reconnect-এ event/submit পাঠানোর চেষ্টা করবে; server-এ event না পৌঁছালে তখনই forced submission নিশ্চিত করা যায় না। Cron deadline-এ পূর্বে সংরক্ষিত উত্তর দিয়ে জমা করবে।

Fullscreen সমর্থন নেই এমন browser-এ Live exam শুরু হবে না। সমর্থিত desktop Chrome/Edge/Firefox বা Fullscreen-সমর্থিত mobile browser ব্যবহার করুন। ফোন কল, app switch বা window focus হারানোও warning তৈরি করতে পারে—তাই শুরু করার আগেই শিক্ষার্থীকে নিয়ম দেখানো হয়। এটি browser-based deterrence; browser event বন্ধ করে দেওয়া বা অন্য device ব্যবহার রোধ করার proctoring software নয়।

## ৬. কোন পরীক্ষায় কোন নিয়ম

| ধরন | Autosave / Resume | Deadline auto-submit | Fullscreen / দ্বিতীয় departure-এ submit |
| --- | --- | --- | --- |
| Live exam | আছে | আছে | আছে |
| Model/free exam | আছে | আছে | নেই |
| আলাদা Practice session | আগের manual flow | প্রযোজ্য নয় | নেই |

Admin → `/admin/results`-এ কারণ দেখাবে: **নিজে জমা**, **সময় শেষ**, অথবা **দুইবার পরীক্ষা ছেড়েছে**। আগে থেকে থাকা results-এর reason খালি থাকলে `—` দেখাবে।

## ৭. নিজের deployment-এ ছোট পরীক্ষা

একটি আলাদা free Live test exam তৈরি করে ২ মিনিট duration দিন; শুরু/শেষের সময় ও Published question ঠিক রাখুন। Actual exam দিয়ে পরীক্ষা করবেন না—Live attempt একবারই দেওয়া যায়।

- Student account দিয়ে শুরু → একটি উত্তর দিন → saved confirmation দেখুন।
- অন্য tab-এ একবার যান → ফিরে প্রথম warning দেখুন। Continue → দ্বিতীয়বার যান → automatic submission দেখুন। Admin results মিলিয়ে দেখুন।
- আলাদা test exam-এ উত্তর save করে browser বন্ধ করুন। Deadline-এর পর Cron run history ও Admin results দেখুন। Saved উত্তর অনুযায়ী নম্বর হয়েছে কি না মিলিয়ে নিন।
- আলাদা test attempt refresh করে একই deadline, উত্তর ও warning count আছে কি না দেখুন। Refresh browser অনুসারে একটি departure হিসেবে গণনা হতে পারে।
- Results/answers release ভবিষ্যতে রাখলে তার আগে score/answer প্রকাশ হচ্ছে না নিশ্চিত করুন।

## যাচাই ও সীমা

Production build, TypeScript ও ESLint passed। Local PGlite-এ **৩৯টি** database/client-rule check এবং Next HTTP + mocked Supabase-এ **১৫টি** auth/render/API check passed। রিপোর্ট: `supabase/EXAM-SAFETY-VALIDATION.json` ও `supabase/EXAM-HTTP-VALIDATION.json`।

এই environment থেকে আপনার hosted Supabase Cron চালু করা বা আসল desktop/mobile browser-এ fullscreen/tab switching click-through করা হয়নি। তাই deploy করার পরে ওপরের ছোট পরীক্ষা করুন।

Official references:

- https://supabase.com/docs/guides/cron/install
- https://supabase.com/docs/guides/cron/quickstart
- https://developer.mozilla.org/en-US/docs/Web/API/Document/visibilitychange_event
- https://developer.mozilla.org/en-US/docs/Web/API/Element/requestFullscreen
