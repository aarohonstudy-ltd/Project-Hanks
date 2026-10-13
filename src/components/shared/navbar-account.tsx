/* eslint-disable @next/next/no-location-assign-relative-destination -- Logout reload clears authenticated client state. */
"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { Avatar as AvatarPrimitive } from "radix-ui";
import { Home, LayoutDashboard, LogIn, LogOut, UserRound } from "lucide-react";
import Link from "next/link";
import { browserClient } from "@/lib/supabase/client";
import { disableBrowserPush } from "@/lib/notifications/browser";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

export default function NavbarAccount({
  dashboard = false,
}: {
  dashboard?: boolean;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<{
    id: string;
    full_name: string;
    avatar_url: string | null;
  } | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // INITIAL_SESSION and subsequent auth events keep tabs and client navigation in sync.
    const { data } = browserClient().auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setReady(true);
      },
    );
    return () => data.subscription.unsubscribe();
  }, []);

  const userId = user?.id;
  useEffect(() => {
    if (!userId) return;
    let active = true;
    // Profile data is fetched outside the auth callback to avoid auth-lock deadlocks.
    void browserClient()
      .from("profiles")
      .select("id,full_name,avatar_url")
      .eq("id", userId)
      .maybeSingle()
      .then(({ data }) => {
        if (active) setProfile(data);
      });
    return () => {
      active = false;
    };
  }, [userId]);

  async function logout() {
    setBusy(true);
    setError("");
    try {
      await disableBrowserPush().catch(() => undefined);
      const { error } = await browserClient().auth.signOut({ scope: "local" });
      if (error) throw error;
      window.location.assign("/");
    } catch {
      setError("লগআউট হয়নি। আবার চেষ্টা করুন।");
      setBusy(false);
    }
  }

  if (!ready)
    return (
      <span
        className="size-10 animate-pulse rounded-full bg-muted"
        aria-label="অ্যাকাউন্ট লোড হচ্ছে"
      />
    );
  if (!user)
    return (
      <Button
        asChild
        className="h-10 gap-2 rounded-full bg-sky-700 px-4 text-white hover:bg-sky-800"
      >
        <Link href="/login">
          <LogIn className="size-4" />
          লগইন
        </Link>
      </Button>
    );

  const metadata = user.user_metadata;
  const currentProfile = profile?.id === user.id ? profile : null;
  const name =
    currentProfile?.full_name ||
    (typeof metadata.full_name === "string"
      ? metadata.full_name
      : "আমার অ্যাকাউন্ট");
  const photo =
    currentProfile?.avatar_url || metadata.avatar_url || metadata.picture;
  const src =
    typeof photo === "string" && /^https?:\/\//i.test(photo)
      ? photo
      : undefined;

  return (
    <div className="relative">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="size-11 rounded-full border p-0"
            aria-label="অ্যাকাউন্ট মেনু খুলুন"
          >
            <AvatarPrimitive.Root className="flex size-10 items-center justify-center overflow-hidden rounded-full bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200">
              <AvatarPrimitive.Image
                src={src}
                alt={name}
                referrerPolicy="no-referrer"
                className="size-full object-cover"
              />
              <AvatarPrimitive.Fallback className="flex size-full items-center justify-center">
                <UserRound className="size-6" />
              </AvatarPrimitive.Fallback>
            </AvatarPrimitive.Root>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60" lang="bn">
          <DropdownMenuLabel className="truncate">{name}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href={dashboard ? "/" : "/dashboard"}>
              {dashboard ? <Home /> : <LayoutDashboard />}
              {dashboard ? "মূল ওয়েবসাইট" : "ড্যাশবোর্ড"}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/dashboard/profile">
              <UserRound />
              প্রোফাইল
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            disabled={busy}
            onSelect={(event) => {
              event.preventDefault();
              void logout();
            }}
          >
            <LogOut />
            {busy ? "লগআউট হচ্ছে…" : "লগআউট"}
          </DropdownMenuItem>
          {error && (
            <p role="alert" className="px-2 py-2 text-sm text-destructive">
              {error}
            </p>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
