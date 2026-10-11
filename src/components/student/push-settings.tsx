"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { saveSubscription } from "@/lib/notifications/actions";
import { disableBrowserPush } from "@/lib/notifications/browser";
export default function PushSettings() {
  const [supported, setSupported] = useState(false),
    [enabled, setEnabled] = useState(false),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  useEffect(() => {
    let mounted = true;
    queueMicrotask(() => {
      if (mounted)
        setSupported(
          "serviceWorker" in navigator &&
            "PushManager" in window &&
            "Notification" in window,
        );
    });
    return () => {
      mounted = false;
    };
  }, []);
  async function enable() {
    setBusy(true);
    setMessage("");
    let subscription: PushSubscription | null = null;
    try {
      const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!key)
        throw Error("Push notification এখনো প্রস্তুত নয়। পরে চেষ্টা করুন।");
      if ((await Notification.requestPermission()) !== "granted")
        throw Error(
          "Browser settings থেকে এই site-এর Notifications Allow করুন।",
        );
      await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      const registration = await navigator.serviceWorker.ready;
      subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        const normalized = key.replace(/-/g, "+").replace(/_/g, "/");
        const bytes = Uint8Array.from(
          atob(normalized + "=".repeat((4 - (normalized.length % 4)) % 4)),
          (c) => c.charCodeAt(0),
        );
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: bytes,
        });
      }
      const json = subscription.toJSON();
      const result = await saveSubscription({
        endpoint: subscription.endpoint,
        keys: { p256dh: json.keys!.p256dh, auth: json.keys!.auth },
      });
      if (result.error) throw Error(result.error);
      setEnabled(true);
      setMessage("এই device-এ notification চালু হয়েছে।");
    } catch (e) {
      setMessage(
        e instanceof Error ? e.message : "চালু হয়নি। আবার চেষ্টা করুন।",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="rounded-xl border p-4 space-y-3">
      <h3 className="font-semibold">Device-এ push notification</h3>
      <p className="text-sm text-muted-foreground">
        নতুন পরীক্ষা ও কোর্সের আপডেট পেতে চালু করুন। অনুমতি না দিলেও নিচে
        site-এর notifications পাবেন।
      </p>
      {supported ? (
        <div className="flex flex-wrap gap-2">
          <Button disabled={busy} onClick={() => void enable()}>
            {enabled
              ? "চালু আছে · আবার সংযুক্ত করুন"
              : "Notification চালু করুন"}
          </Button>
          <Button
            variant="outline"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await disableBrowserPush();
                setEnabled(false);
                setMessage("এই device-এ বন্ধ হয়েছে।");
              } catch {
                setMessage("বন্ধ করা যায়নি। Browser settings দেখুন।");
              } finally {
                setBusy(false);
              }
            }}
          >
            বন্ধ করুন
          </Button>
        </div>
      ) : (
        <p className="text-sm">
          এই browser-এ push পাওয়া না গেলে সমর্থিত browser ব্যবহার করুন। iPhone-এ
          Home Screen-এ site যোগ করে সেখান থেকে খুলুন।
        </p>
      )}
      <p role="status" className="text-sm">
        {message}
      </p>
    </div>
  );
}
