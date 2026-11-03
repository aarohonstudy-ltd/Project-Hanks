# Auto exam builder

## Setup

1. আগের 014 ও 015 migration applied থাকতে হবে। Supabase SQL Editor-এ শুধু নতুন `supabase/016_exam_builder.sql` চালান। Repeatable; existing user, প্রশ্ন বা ফলাফল মুছে না।
2. ZIP-এর code update করুন। নতুন dependency/ENV/service-role key নেই। `npm install` → `npm run build` → deploy।
3. Admin → পরীক্ষা → নতুন পরীক্ষা / সম্পাদনা খুলুন।

## Random প্রশ্ন নেওয়া

- **স্বয়ংক্রিয়ভাবে random প্রশ্ন নিন** খুলুন।
- **প্রতি টপিক থেকে নির্দিষ্ট সংখ্যক**: যেমন বাংলা ব্যাকরণ ১০ + ইংরেজি Grammar ১৫ + গণিত ৫ = ৩০টি। নির্বাচন random, কিন্তু topic quota ঠিক থাকে।
- **পুরো random**: নির্বাচিত topic pool থেকে মোট যতটি চান। এখানে প্রত্যেক topic থেকে প্রশ্ন আসতেই হবে এমন নয়।
- Difficulty filter দেওয়া যায়। Default-এ published exam-এ থাকা বা exam/practice attempt-এ ব্যবহৃত প্রশ্ন বাদ যায়। Checkbox সরালে সেগুলোও pool-এ আসে। “Fresh” মানে পূর্বে ব্যবহার/reference হয়নি; কেউ question bank-এ আগে দেখেনি—এমন নিশ্চয়তা নয়।
- Topic-এর পাশে published count filter দেওয়ার আগের সংখ্যা। Filter-এর পরে প্রশ্ন কম থাকলে topic ও ঘাটতি দেখায়; কম প্রশ্ন নিয়ে নীরবে exam তৈরি করে না।
- সর্বোচ্চ ২০০টি; duplicate question/topic quota নেয় না। Generate বর্তমান তালিকা বদলায়—আগে checkbox দিয়ে সেটা স্বীকার করতে হবে। Generate নিজে exam save/publish করে না।
- তালিকা থেকে manual প্রশ্ন যোগ/সরানো, উপরে ওঠানো, প্রতিটির marks/negative marks বদলানো যায়। **সব প্রশ্নে প্রয়োগ** দিয়ে একসঙ্গে marks/কর্তন দেওয়া যায়।
- সব শেষে exam **সংরক্ষণ করুন**। প্রথমে Draft রেখে preview/demo যাচাই করে Published করা সুবিধাজনক।

## Preview, প্রশ্ন edit এবং demo

- Editor-এর **Preview / Demo / প্রশ্ন সম্পাদনা** unsaved selection-ও দেখায়। পরীক্ষার নাম, সময়, মোট নম্বর, সঠিক উত্তর ও ব্যাখ্যা দেখা যায়। Saved exam-এর তালিকাতেও **Preview / Demo** আছে; locked/archived exam-এও preview চলে।
- **সম্পাদনা · নতুন কপি** মূল প্রশ্ন পাল্টায় না। নতুন published question তৈরি করে এই editor-এর selected item বদলায়। পুরোনো exam/result অক্ষত থাকে। Topic আগেরটি থাকে; text/options/correct answer/difficulty/explanation বদলানো যায়। তারপর exam-টিও Save করতে হবে। Editor cancel করলে নতুন প্রশ্নটি bank-এ থেকে যাবে; exam পরিবর্তন হবে না।
- Exam attempt শুরু হয়ে গেলে editing আগের মতো locked। Preview/demo তখনও করা যায়। প্রশ্ন ব্যাংকের সাধারণ editor/Status দিয়ে unused question edit/archive করা যায়; ব্যবহৃত প্রশ্নের সুরক্ষা অপরিবর্তিত।
- Demo-তে timer, question navigation, answered count, live-mode first-answer lock, score, negative marking, pass/fail ও explanation আছে। Model test-এ submit-এর আগে উত্তর বদলানো যায়। Timer শেষেও demo result দেখা যায়।
- Demo শুধু React memory-তে চলে: কোনো student exam endpoint, attempt, result, answer row, localStorage result বা leaderboard update করে না। Preview-তে ফেরা/বন্ধ করা/reload-এ demo হারিয়ে যায়।
- Admin demo schedule/enrollment/fullscreen/tab-violation enforcement চালায় না—সেগুলো real student exam-এর নিয়ম। Demo student exam শুরু করে না। Live schedule পূর্ণাঙ্গভাবে যাচাই করতে আলাদা test student দিয়ে test exam দিতে হবে।

## Archive

প্রতিটি non-archived exam row-এ Archive আছে। চলমান student attempt থাকলে server আটকে দেয়। Archive করলে আগের result/delete হয় না; admin preview করা যায়। Attempted exam-এর প্রশ্ন পরিবর্তন করা যায় না।

## Validation

Production build/TypeScript ও ESLint; local PGlite-এ ৩০টি check: quota/count, no duplicates, filters, shortage, draft exclusion, admin-only access, expired session, preview without writes, edited-copy preservation, archive safeguards এবং demo score।
`supabase/EXAM-BUILDER-VALIDATION.json` শুধু test report; SQL Editor-এ চালাতে হবে না। Real browser clicks, mobile layout ও hosted Supabase-এ যাচাই এই পরিবেশে করা হয়নি।
