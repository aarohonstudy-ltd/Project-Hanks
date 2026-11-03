# Google login ও dashboard loading update

কোডে পাওয়া অপ্রয়োজনীয় অপেক্ষা কমানো হয়েছে:

- Google callback-এর verified code exchange থেকে user পাওয়া গেলে database profile দেখে সরাসরি `/admin` বা `/dashboard`-এ যায়; স্বাভাবিক ক্ষেত্রে `/auth/landing` redirect বাদ।
- Proxy শুধু protected dashboard/admin routes-এ চলে। Callback নিজেই code exchange করে এবং email/password landing নিজেই authenticated user যাচাই করে।
- Proxy-তে `getClaims()` ব্যবহার হয়েছে। Supabase-এর asymmetric signing keys থাকলে cached public key দিয়ে JWT verification করতে পারে; পুরোনো symmetric key হলে SDK Auth server verification-এ fallback করতে পারে। এটি auth check বাদ দেওয়া নয়।
- Dashboard এখনও server-এ `getUser()` ও secured RPC ব্যবহার করে। Dashboard RPC এবং profile query এখন parallel।
- Admin page ও layout-এর `requireAdmin()` একই server render-এ React cache দিয়ে deduplicate হয়; user-দের মধ্যে auth data share হয় না। সব admin mutation-এর authorization আগের মতো থাকে।
- Dashboard data আসার সময় এখন loading UI দেখায়।

## Deploy

পরিবর্তিত files নিয়ে deploy করুন। নতুন SQL, dependency, ENV, Google provider বা redirect URL পরিবর্তন লাগবে না। নিজস্ব `.env.local` রাখুন।

## সীমা ও পরীক্ষা

এই পরিবেশ থেকে আপনার live Google account login বা production timing মাপা হয়নি; Google-ই ধীর এমন সিদ্ধান্ত নেওয়া হয়নি। Mocked callback test-এ student/admin routing, failed exchange ও fallback যাচাই হয়েছে; local HTTP checks ও build/lint করা হয়েছে।

বর্তমান dashboard RPC এখনও accessible প্রশ্ন, course ও attempts একসঙ্গে আনে। অনেক প্রশ্ন/history থাকলে database query ও response size দেরির আরেকটি কারণ হতে পারে; এই ছোট update-এ pagination/feature behaviour পরিবর্তন করা হয়নি। Deploy-এর পরও ধীর হলে live site URL, আনুমানিক সময় এবং Google account বাছাইয়ের আগে নাকি site-এ ফেরার পরে দেরি হয় জানান। Google screen বাদে site-এর Network timing-এ dashboard document/RSC request ও backend duration দেখে পরের bottleneck নির্ধারণ করা যাবে।

Reference: https://supabase.com/docs/reference/javascript/auth-getclaims
