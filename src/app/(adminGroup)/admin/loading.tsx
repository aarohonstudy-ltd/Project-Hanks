export default function Loading() {
  return (
    <div role="status" aria-live="polite" className="space-y-5 py-4">
      <p className="text-sm text-muted-foreground">তথ্য লোড হচ্ছে…</p>
      <div aria-hidden="true" className="animate-pulse space-y-4">
        <div className="h-8 w-48 rounded-lg bg-muted" />
        <div className="h-12 rounded-xl bg-muted" />
        <div className="h-64 rounded-xl bg-muted" />
      </div>
    </div>
  );
}
