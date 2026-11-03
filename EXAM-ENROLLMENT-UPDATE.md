# Exam enrollment cards

## Setup

আগের updates applied থাকলে Supabase SQL Editor-এ `supabase/017_exam_enrollment_cards.sql` চালান। এরপর code build/deploy করুন এবং dashboard reload করুন। নতুন ENV/dependency নেই। SQL repeatable; কোনো enrollment/result মুছে না।

## আচরণ

- Admin exam editor-এর `course_id` ও `is_free` অনুযায়ী access নির্ধারিত হয়। Question bank-এর topic দেখে course অনুমান করে না। Course-only exam বানাতে সঠিক course নির্বাচন করুন এবং **সবার জন্য ফ্রি** বন্ধ রাখুন।
- Course-only exam-এ active enrollment না থাকলে Start disabled। Course-এর নাম ও catalog link দেখায়; লিংকে গেলে প্রয়োজনীয় course highlight হয়ে উপরে আসে।
- Pending request থাকলেও Start disabled; অনুমোদন অপেক্ষমাণ লেখা দেখায়। **ভর্তির তথ্য আবার যাচাই করুন** দিয়ে সর্বশেষ server data আনা যায়।
- Expired/revoked enrollment নতুন data-তে locked থাকে। Open page-এর data পরে stale হলে server start request আবার যাচাই করে; continuous realtime subscription নেই।
- Free exam enrollment ছাড়াই আগের মতো চলে। Upcoming exam-এ reminder রাখা যায়; সময় হওয়ার আগে start হয় না। Closed exam-এর Start বন্ধ থাকে।
- Card ছাড়াও dashboard start/begin handler guard আছে। Backend enrollment check আগের মতো বহাল। Already running exam resume-এর নীতি বদলানো হয়নি।
- Paid exam-এর course metadata missing হলে অনুমতি দেওয়া হয় না; তথ্য না পাওয়ার বার্তা দেখায়।

## যাচাই

Build/TypeScript, lint এবং local PGlite + client helper-এ non-enrolled, active, pending, expired, revoked ও free exam যাচাই। `supabase/EXAM-ACCESS-VALIDATION.json` test report; SQL Editor-এ চালাবেন না। Hosted database বা বাস্তব browser-এ deploy/test করা হয়নি।
