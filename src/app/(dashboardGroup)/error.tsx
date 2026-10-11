"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="p-10">
      <h1>ড্যাশবোর্ড লোড হয়নি</h1>
      <p>
        Supabase-এ 005_dashboard_runtime.sql চালানো হয়েছে এবং অ্যাকাউন্ট active
        আছে কি না দেখুন।
      </p>
      <button onClick={reset}>আবার চেষ্টা করুন</button>
      <p>
        <a href="/login">লগইন পেজে যান</a>
      </p>
    </main>
  );
}
