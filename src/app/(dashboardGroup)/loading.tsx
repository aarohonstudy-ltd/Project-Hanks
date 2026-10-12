export default function Loading() {
  return (
    <main className="min-h-screen grid place-items-center p-6">
      <div role="status" aria-live="polite" className="space-y-3 text-center">
        <div
          aria-hidden="true"
          className="mx-auto size-8 animate-spin rounded-full border-2 border-primary border-t-transparent"
        />
        <h1 className="text-xl font-semibold">ড্যাশবোর্ড প্রস্তুত হচ্ছে…</h1>
        <p className="text-sm text-muted-foreground">
          আপনার কোর্স ও পরীক্ষার তথ্য আনা হচ্ছে।
        </p>
      </div>
    </main>
  );
}
