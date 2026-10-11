"use server";
import { serverClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { sections, type AdminData } from "./types";
async function authorized() {
  const client = await serverClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) throw Error("আবার লগইন করুন।");
  const { data: profile } = await client
    .from("profiles")
    .select("role,status")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin" || profile.status !== "active")
    throw Error("Admin access required");
  return client;
}
function errorMessage(e: unknown) {
  return e instanceof Error ? e.message : "আবার চেষ্টা করুন।";
}
export async function readAdmin(
  section: string,
  search = "",
  page = 1,
): Promise<{ data?: AdminData; error?: string }> {
  try {
    if (!sections.some(([s]) => s === section)) throw Error("Invalid section");
    const client = await authorized();
    const { data, error } = await client.rpc("aarohon_admin_data", {
      view_name: section,
      search_text: search.slice(0, 200),
      page_number: page,
    });
    if (error)
      throw Error(
        "ডেটা লোড হয়নি। 006_admin_panel.sql চালানো হয়েছে কি না দেখুন।",
      );
    return { data: data as AdminData };
  } catch (e) {
    return { error: errorMessage(e) };
  }
}
export async function saveAdmin(
  action: string,
  payload: Record<string, unknown>,
): Promise<{ error?: string; message?: string }> {
  try {
    if (
      ![
        "course_save",
        "subject_save",
        "topic_save",
        "lesson_save",
        "question_save",
        "exam_save",
        "exam_status",
        "request_review",
        "student_status",
      ].includes(action)
    )
      throw Error("Invalid action");
    const client = await authorized();
    const { error } = await client.rpc("aarohon_admin_save", {
      action_name: action,
      payload,
    });
    if (error) {
      const message =
        error.code === "P0001"
          ? error.message
          : error.code === "23505"
            ? "একই slug, নাম বা lesson position আগে থেকে আছে।"
            : error.code === "23514"
              ? "দাম, নম্বর, সময় বা status-এর মান ঠিক করুন।"
              : error.code === "23503"
                ? "নির্বাচিত বিষয়, কোর্স বা প্রশ্ন আর পাওয়া যাচ্ছে না।"
                : error.code === "42501"
                  ? "Admin access required"
                  : "সংরক্ষণ হয়নি। প্রয়োজনীয় সব ঘর সঠিকভাবে পূরণ করুন।";
      throw Error(message);
    }
    revalidatePath("/admin", "layout");
    revalidatePath("/dashboard", "layout");
    return { message: "সংরক্ষিত হয়েছে।" };
  } catch (e) {
    return { error: errorMessage(e) };
  }
}
