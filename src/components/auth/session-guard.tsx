"use client";
import { useEffect, useState } from "react";
import { browserClient } from "@/lib/supabase/client";
export type SessionStatus = {
  valid: boolean;
  expiresAt: string | null;
  serverNow: string;
};
export default function SessionGuard({ initial }: { initial?: SessionStatus }) {
  const [expired, setExpired] = useState(false);
  useEffect(() => {
    const client = browserClient();
    let stopped = false,
      ending = false,
      checking = false;
    let deadline = initial?.expiresAt
      ? Date.now() +
        Date.parse(initial.expiresAt) -
        Date.parse(initial.serverNow)
      : Infinity;
    async function end() {
      if (ending || stopped) return;
      ending = true;
      setExpired(true);
      if ("serviceWorker" in navigator) {
        void navigator.serviceWorker
          .getRegistration("/")
          .then(async (registration) => {
            const subscription =
              await registration?.pushManager.getSubscription();
            await subscription?.unsubscribe();
          })
          .catch(() => undefined);
      }
      // Revoke this browser's refresh session; other devices remain signed in.
      await Promise.race([
        client.auth.signOut({ scope: "local" }).catch(() => undefined),
        new Promise((resolve) => setTimeout(resolve, 4000)),
      ]);
      if (!stopped) window.location.replace("/login?reason=session-expired");
    }
    async function check() {
      if (stopped || ending || checking) return;
      if (Date.now() >= deadline) {
        void end();
        return;
      }
      checking = true;
      try {
        const { data, error } = await client.rpc("aarohon_session_status");
        if (stopped) return;
        if (!error && data) {
          if (!data.valid) void end();
          else
            deadline =
              Date.now() +
              Date.parse(data.expiresAt) -
              Date.parse(data.serverNow);
        }
        // Network failures never masquerade as logout. The known deadline still applies.
      } catch {
        // Keep the known deadline when the network is unavailable.
      } finally {
        checking = false;
      }
    }
    const tick = setInterval(() => {
      if (Date.now() >= deadline) void end();
    }, 1000);
    const poll = setInterval(() => {
      void check();
    }, 60000);
    const focus = () => {
      void check();
    };
    window.addEventListener("focus", focus);
    if (!initial) void check();
    const { data: subscription } = client.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT")
        setTimeout(() => {
          void end();
        }, 0);
    });
    return () => {
      stopped = true;
      clearInterval(tick);
      clearInterval(poll);
      window.removeEventListener("focus", focus);
      subscription.subscription.unsubscribe();
    };
  }, [initial]);
  return expired ? (
    <div
      role="alert"
      className="fixed inset-0 z-[9999] grid place-items-center bg-background p-8 text-foreground"
    >
      সেশন শেষ হয়েছে। আবার লগইন করুন…
    </div>
  ) : null;
}
