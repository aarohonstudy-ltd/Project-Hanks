import Link from "next/link";
export default function Page() {
  return (
    <main className="max-w-xl mx-auto py-24 px-6 space-y-5">
      <h1 className="text-3xl font-bold">অ্যাডমিন অনুমতি প্রয়োজন</h1>
      <p>
        এই অ্যাকাউন্টে active admin role নেই। নিজের admin email দিয়ে লগইন করুন
        অথবা SQL Editor-এ 004_make_admin.sql দিয়ে অনুমতি দিন।
      </p>
      <div className="flex gap-5">
        <Link href="/dashboard">ড্যাশবোর্ড</Link>
        <Link href="/login">লগইন পেজ</Link>
      </div>
    </main>
  );
}
