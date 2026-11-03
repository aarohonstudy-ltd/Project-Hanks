# Notification dropdown ও Admin navigation update

- Bell icon-এর ঠিক নিচে notification popover খোলে; বাইরে click বা Escape দিয়ে বন্ধ হয়।
- Notifications আগে দেখায়; নিচে expand করলে push settings পাওয়া যায়। লম্বা তালিকা scroll করা যায় এবং mobile viewport-এর মধ্যে থাকে।
- Notification-এর link client-side navigation ব্যবহার করে ও dropdown বন্ধ করে।
- Admin sidebar/header shared `admin/layout.tsx`-এ থাকে। Section পরিবর্তনে শুধু মাঝের content বদলায়, sidebar নতুন করে mount হয় না।
- Loading skeleton শুধু content অংশে। Search Next Form দিয়ে client-side navigation করে। Mobile sidebar menu নির্বাচনের পর বন্ধ হয়।
- প্রতি page ও সব admin mutation-এ আগের authorization বজায় আছে।

## চালু করুন

`CHANGED-FILES.md`-এ দেখানো source files update করুন অথবা পূর্ণ ZIP ব্যবহার করুন। নিজের environment variables রাখুন এবং deploy করুন। নতুন SQL, dependency বা VAPID key লাগবে না।

Build, TypeScript ও lint পাশ করেছে; local Next HTTP-তে admin access ও existing page routes যাচাই হয়েছে। বাস্তব browser-এ dropdown positioning ও navigation interaction এই পরিবেশ থেকে পরীক্ষা করা হয়নি। Deploy-এর পরে bell, বাইরে click, Escape, mobile menu, section switch, search এবং browser Back একবার পরীক্ষা করুন।
