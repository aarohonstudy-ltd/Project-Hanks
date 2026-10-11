"use server";
import webpush from "web-push";
import { serverClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { validPushEndpoint } from "./validation";
export async function saveSubscription(subscription: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}) {
  try {
    const client = await serverClient();
    const { error } = await client.rpc("aarohon_push", {
      action_name: "subscribe",
      payload: {
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    });
    return {
      error: error ? "Notification চালু হয়নি। আবার চেষ্টা করুন।" : undefined,
    };
  } catch {
    return { error: "সংযোগ হয়নি। আবার চেষ্টা করুন।" };
  }
}
export async function removeSubscription(endpoint: string) {
  const client = await serverClient();
  const { error } = await client.rpc("aarohon_push", {
    action_name: "unsubscribe",
    payload: { endpoint },
  });
  return { error: error?.message };
}
function configure() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    privateKey = process.env.VAPID_PRIVATE_KEY,
    subject = process.env.VAPID_SUBJECT;
  if (!publicKey || !privateKey || !subject)
    throw Error("Push setup অসম্পূর্ণ: VAPID environment variables সেট করুন।");
  webpush.setVapidDetails(subject, publicKey, privateKey);
}
export async function createNotification(payload: {
  id: string;
  title: string;
  body: string;
  courseId: string;
  url: string;
}) {
  try {
    configure();
    const client = await serverClient();
    const { data, error } = await client.rpc("aarohon_push", {
      action_name: "create",
      payload,
    });
    if (error)
      throw Error(
        error.code === "P0001"
          ? error.message
          : "Notification তৈরি করা যায়নি। Admin access ও migration যাচাই করুন।",
      );
    revalidatePath("/dashboard", "layout");
    return { id: data.id as string };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Notification তৈরি হয়নি।",
    };
  }
}
type Delivery = {
  id: string;
  lease: string;
  endpoint: string;
  keys: { p256dh: string; auth: string };
  notification: { id: string; title: string; body: string; url: string };
};
export async function deliverNotifications(
  id: string,
): Promise<{ processed?: number; error?: string }> {
  try {
    configure();
    const client = await serverClient();
    // The SECURITY DEFINER RPC checks active admin on every batch. Endpoints never reach the browser.
    const { data, error } = await client.rpc("aarohon_push", {
      action_name: "claim",
      payload: { id },
    });
    if (error) throw Error("Queue খোলা যায়নি। Admin login যাচাই করুন।");
    const jobs = data as Delivery[];
    const results = await Promise.all(
      jobs.map(async (job) => {
        let status = "sent";
        if (!validPushEndpoint(job.endpoint)) status = "skipped";
        else
          try {
            await webpush.sendNotification(
              { endpoint: job.endpoint, keys: job.keys },
              JSON.stringify(job.notification),
              { TTL: 3600, timeout: 8000 },
            );
          } catch (e) {
            const code = (e as { statusCode?: number }).statusCode;
            status = code === 404 || code === 410 ? "expired" : "retry";
          }
        return { id: job.id, lease: job.lease, status };
      }),
    );
    if (results.length) {
      const ack = await client.rpc("aarohon_push", {
        action_name: "ack",
        payload: { results },
      });
      if (ack.error)
        throw Error("Delivery status save হয়নি। ২ মিনিট পরে Resume করুন।");
    }
    revalidatePath("/admin/notifications");
    return { processed: jobs.length };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "পাঠানো যায়নি। পরে Resume করুন।",
    };
  }
}
