"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  createNotification,
  deliverNotifications,
} from "@/lib/notifications/actions";
import type { SectionProps } from "../panel";
export default function Notifications({ data, options }: SectionProps) {
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [error, setError] = useState("");
  const router = useRouter();
  const id = useRef<string | null>(null);
  const lock = useRef(false);
  async function pump(campaign: string) {
    for (let i = 0; i < 100; i++) {
      const result = await deliverNotifications(campaign);
      if (result.error) throw Error(result.error);
      if (!result.processed) break;
      setMessage(`Push পাঠানো হচ্ছে… ${i + 1} batch সম্পন্ন`);
    }
    setMessage(
      "Batch শেষ। নিচে status দেখুন। Pending থাকলে কিছুক্ষণ পরে Resume করুন।",
    );
  }
  async function resume(campaign: string) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      await pump(campaign);
    } catch (e) {
      setError(e instanceof Error ? e.message : "পরে চেষ্টা করুন।");
    } finally {
      lock.current = false;
      setBusy(false);
      router.refresh();
    }
  }
  return (
    <div className="space-y-6">
      <form
        className="sd-panel p-6 space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          if (lock.current) return;
          lock.current = true;
          setBusy(true);
          setError("");
          const form = e.currentTarget;
          const values = new FormData(form);
          id.current ??= crypto.randomUUID();
          try {
            const result = await createNotification({
              id: id.current,
              title: String(values.get("title")),
              body: String(values.get("body")),
              courseId: String(values.get("courseId")),
              url: String(values.get("url")),
            });
            if (result.error || !result.id) throw Error(result.error);
            const campaign = result.id;
            id.current = null;
            form.reset();
            await pump(campaign);
          } catch (e) {
            setError(e instanceof Error ? e.message : "পাঠানো হয়নি।");
          } finally {
            lock.current = false;
            setBusy(false);
            router.refresh();
          }
        }}
      >
        <h2 className="text-xl font-semibold">নতুন notification পাঠান</h2>
        <p className="text-sm text-muted-foreground">
          নির্বাচিত শিক্ষার্থীদের site inbox-এ যাবে। Push চালু করা device-গুলোতে
          browser notification পাঠানো হবে।
        </p>
        <fieldset disabled={busy} className="space-y-4">
          <label className="block">
            কার কাছে
            <select
              className="mt-2 block w-full border rounded-lg bg-background p-3"
              name="courseId"
            >
              <option value="">সকল সক্রিয় শিক্ষার্থী</option>
              {options.courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            শিরোনাম
            <input
              className="mt-2 block w-full border rounded-lg p-3"
              name="title"
              required
              maxLength={100}
            />
          </label>
          <label className="block">
            বার্তা
            <textarea
              className="mt-2 block w-full border rounded-lg p-3"
              name="body"
              required
              maxLength={500}
            />
          </label>
          <label className="block">
            Click করলে কোথায় যাবে
            <input
              className="mt-2 block w-full border rounded-lg p-3"
              name="url"
              defaultValue="/dashboard"
              placeholder="/dashboard/courses"
              pattern="/[a-zA-Z0-9/_?=&%#.-]*"
              maxLength={500}
            />
          </label>
          <Button type="submit">
            {busy ? "পাঠানো হচ্ছে…" : "Notification পাঠান"}
          </Button>
        </fieldset>
      </form>
      {message && <p role="status">{message}</p>}
      {error && (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      )}
      <div className="space-y-3">
        {data.rows.map((row) => (
          <article
            key={row.id}
            className="sd-panel border rounded-xl p-5 space-y-2"
          >
            <h3 className="font-semibold">{String(row.title)}</h3>
            <p className="whitespace-pre-wrap">{String(row.body)}</p>
            <p className="text-sm text-muted-foreground">
              {String(row.audience)} · Inbox: {String(row.recipients)} · Push
              service accepted: {String(row.sent)} · Pending:{" "}
              {String(row.pending)} · Failed/expired: {String(row.failed)}
            </p>
            {Number(row.pending) > 0 && (
              <Button
                variant="outline"
                disabled={busy}
                onClick={() => void resume(row.id)}
              >
                Pending push Resume করুন
              </Button>
            )}
          </article>
        ))}
        {!data.rows.length && <p>এখনো notification পাঠানো হয়নি।</p>}
      </div>
    </div>
  );
}
