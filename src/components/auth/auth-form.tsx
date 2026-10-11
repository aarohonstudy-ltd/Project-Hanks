/* eslint-disable @next/next/no-location-assign-relative-destination -- Full reload clears authenticated client state. */
"use client";
import { useState } from "react";
import Link from "next/link";
import { browserClient } from "@/lib/supabase/client";
export default function AuthForm({ register = false }: { register?: boolean }) {
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  return (
    <main className="mx-auto max-w-md px-6 py-20">
      <h1 className="text-3xl font-bold mb-6">
        {register ? "নতুন অ্যাকাউন্ট তৈরি করুন" : "লগইন করুন"}
      </h1>
      <form
        className="grid gap-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setMessage("");
          const f = new FormData(e.currentTarget);
          try {
            const client = browserClient();
            const email = String(f.get("email")),
              password = String(f.get("password"));
            const result = register
              ? await client.auth.signUp({
                  email,
                  password,
                  options: {
                    data: { full_name: String(f.get("name")) },
                    emailRedirectTo: location.origin + "/auth/callback",
                  },
                })
              : await client.auth.signInWithPassword({ email, password });
            if (result.error) throw result.error;
            if (result.data.session) location.assign("/dashboard");
            else setMessage("ইমেইলে পাঠানো লিংক দিয়ে অ্যাকাউন্ট নিশ্চিত করুন।");
          } catch (err) {
            setMessage(
              err instanceof Error ? err.message : "আবার চেষ্টা করুন।",
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        {register && (
          <label>
            নাম
            <input
              className="border rounded p-3 w-full"
              name="name"
              required
              maxLength={80}
            />
          </label>
        )}
        <label>
          ইমেইল
          <input
            className="border rounded p-3 w-full"
            name="email"
            type="email"
            required
            autoComplete="email"
          />
        </label>
        <label>
          পাসওয়ার্ড
          <input
            className="border rounded p-3 w-full"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete={register ? "new-password" : "current-password"}
          />
        </label>
        <button
          className="bg-primary text-primary-foreground rounded p-3"
          disabled={busy}
        >
          {busy ? "অপেক্ষা করুন…" : register ? "অ্যাকাউন্ট তৈরি করুন" : "লগইন"}
        </button>
      </form>
      <button
        className="border rounded p-3 w-full mt-4"
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          try {
            const { error } = await browserClient().auth.signInWithOAuth({
              provider: "google",
              options: { redirectTo: location.origin + "/auth/callback" },
            });
            if (error) throw error;
          } catch (err) {
            setMessage(
              err instanceof Error ? err.message : "Google login failed",
            );
            setBusy(false);
          }
        }}
      >
        Google দিয়ে চালিয়ে যান
      </button>
      <p role="status" className="my-4">
        {message}
      </p>
      <Link href={register ? "/login" : "/register"}>
        {register
          ? "আগে অ্যাকাউন্ট আছে? লগইন করুন"
          : "নতুন? অ্যাকাউন্ট তৈরি করুন"}
      </Link>
    </main>
  );
}
