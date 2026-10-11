"use client";
import { removeSubscription } from "./actions";
export async function disableBrowserPush() {
  if (!("serviceWorker" in navigator)) return;
  const registration = await navigator.serviceWorker.getRegistration("/");
  const subscription = await registration?.pushManager.getSubscription();
  if (subscription) {
    try {
      await removeSubscription(subscription.endpoint);
    } finally {
      await subscription.unsubscribe();
    }
  }
}
