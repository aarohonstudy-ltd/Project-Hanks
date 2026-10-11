"use server";
import { serverClient } from "@/lib/supabase/server";
import type { StudentData, Question } from "./types";
export type Session = {
  attemptId: string;
  practice: boolean;
  deadline: string | null;
  serverNow: string;
  items: Question[];
};
export type ActionResult = {
  data?: StudentData;
  message?: string;
  session?: Session;
  lesson?: {
    id: string;
    title: string;
    content: string;
    videoUrl: string | null;
  };
  attemptId?: string;
  error?: string;
};
export async function studentAction(
  action: string,
  payload: Record<string, unknown> = {},
): Promise<ActionResult> {
  const allowed = [
    "profile",
    "bookmark",
    "reminder",
    "enroll",
    "lesson",
    "complete_lesson",
    "read_notifications",
    "referral_code",
    "start",
    "start_practice",
    "submit",
  ];
  if (!allowed.includes(action)) return { error: "Invalid action" };
  try {
    const client = await serverClient();
    const {
      data: { user },
    } = await client.auth.getUser();
    if (!user) return { error: "সেশন শেষ হয়েছে। আবার লগইন করুন।" };
    const { data, error } = await client.rpc("aarohon_student_action", {
      action,
      payload,
    });
    if (error)
      return {
        error:
          error.code === "P0001"
            ? error.message
            : "তথ্য সংরক্ষণ করা যায়নি। আবার চেষ্টা করুন।",
      };
    return data as ActionResult;
  } catch {
    return { error: "সংযোগ করা যায়নি। আবার চেষ্টা করুন।" };
  }
}
