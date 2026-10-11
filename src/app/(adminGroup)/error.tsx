"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="p-10">
      <h1>অ্যাডমিন প্যানেল লোড হয়নি</h1>
      <p>সংযোগ ও SQL setup যাচাই করুন।</p>
      <button onClick={reset}>আবার চেষ্টা করুন</button>
    </main>
  );
}
