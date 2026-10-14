"use server";
import { serverClient } from "@/lib/supabase/server";
import { publicClient } from "@/lib/supabase/public";

export async function changePassword(
  current: string,
  next: string,
): Promise<{ error?: string; message?: string }> {
  if (typeof next !== "string" || next.length < 8 || next.length > 72)
    return { error: "নতুন পাসওয়ার্ড ৮–৭২ অক্ষরের হতে হবে।" };
  try {
    const client = await serverClient();
    const {
      data: { user },
    } = await client.auth.getUser();
    if (!user?.email) return { error: "সেশন শেষ হয়েছে। আবার লগইন করুন।" };
    // Google-only accounts have no password yet; they may set one directly.
    const hasPassword = !!user.identities?.some((i) => i.provider === "email");
    if (hasPassword) {
      if (!current) return { error: "বর্তমান পাসওয়ার্ড লিখুন।" };
      if (current === next)
        return { error: "নতুন পাসওয়ার্ড আগেরটির থেকে আলাদা হতে হবে।" };
      // Supabase does not check the old password on update, so verify it on a
      // separate cookie-free client and revoke that temporary session.
      const verifier = publicClient();
      const { error } = await verifier.auth.signInWithPassword({
        email: user.email,
        password: current,
      });
      if (error) return { error: "বর্তমান পাসওয়ার্ড সঠিক নয়।" };
      await verifier.auth.signOut({ scope: "local" });
    }
    const { error } = await client.auth.updateUser({ password: next });
    if (error)
      return {
        error:
          error.code === "same_password"
            ? "নতুন পাসওয়ার্ড আগেরটির থেকে আলাদা হতে হবে।"
            : error.code === "weak_password"
              ? "পাসওয়ার্ডটি দুর্বল। অক্ষর, সংখ্যা ও চিহ্ন মিলিয়ে আরও শক্তিশালী পাসওয়ার্ড দিন।"
              : error.code === "reauthentication_needed"
                ? "নিরাপত্তার জন্য লগআউট করে আবার লগইন করুন, তারপর পাসওয়ার্ড পরিবর্তন করুন।"
                : "পাসওয়ার্ড পরিবর্তন হয়নি। আবার চেষ্টা করুন।",
      };
    // Other devices must sign in again with the new password; this one stays signed in.
    await client.auth.signOut({ scope: "others" });
    return {
      message: hasPassword
        ? "পাসওয়ার্ড পরিবর্তন হয়েছে। অন্য ডিভাইস থেকে লগআউট করা হয়েছে।"
        : "পাসওয়ার্ড সেট হয়েছে। এখন ইমেইল ও পাসওয়ার্ড দিয়েও লগইন করতে পারবেন।",
    };
  } catch {
    return { error: "সংযোগ করা যায়নি। আবার চেষ্টা করুন।" };
  }
}
