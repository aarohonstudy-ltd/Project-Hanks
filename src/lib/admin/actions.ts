"use server";
import { serverClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { sections, type AdminData } from "./types";
// Local JWT check only; every admin RPC calls require_admin, which verifies
// the session lifetime, role and status in the database.
async function authorized() {
  const client = await serverClient();
  const { data: auth } = await client.auth.getClaims();
  if (!auth?.claims) throw Error("আবার লগইন করুন।");
  return client;
}
function errorMessage(e: unknown) {
  return e instanceof Error ? e.message : "আবার চেষ্টা করুন।";
}
function accessError(code: string) {
  if (code === "PT401") return "সেশন শেষ হয়েছে। আবার লগইন করুন।";
  if (code === "42501") return "Admin access required";
}
// Database CHECK rules by constraint name, so a rejected save says exactly why.
const checkMessages: Record<string, string> = {
  exams_check2:
    "পেইড পরীক্ষার জন্য একটি কোর্স নির্বাচন করুন, অথবা “সবার জন্য ফ্রি” চালু করুন।",
  exams_check1: "লাইভ পরীক্ষার জন্য শুরু ও শেষ — দুটো সময়ই দিন।",
  exams_check: "শেষের সময় শুরুর সময়ের পরে হতে হবে।",
  exams_duration_minutes_check: "পরীক্ষার সময় (মিনিট) কমপক্ষে ১ দিন।",
  exams_pass_mark_check: "পাস নম্বর ০ বা তার বেশি দিন।",
  exam_questions_marks_check: "প্রতিটি প্রশ্নের নম্বর ০-এর বেশি দিন।",
  exam_questions_check:
    "প্রশ্নের কর্তন ০ থেকে সেই প্রশ্নের নম্বরের মধ্যে রাখুন।",
  courses_price_check: "দাম ০ বা তার বেশি দিন।",
  courses_check: "অফার মূল্য ০ থেকে মূল দামের মধ্যে রাখুন।",
};
function checkMessage(message: string) {
  const name = /check constraint "([^"]+)"/.exec(message)?.[1] ?? "";
  return checkMessages[name] ?? "দাম, নম্বর, সময় বা status-এর মান ঠিক করুন।";
}
function revalidatePublic() {
  revalidatePath("/");
  revalidatePath("/courses/[courseId]", "page");
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
        accessError(error.code) ??
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
): Promise<{ error?: string; message?: string; id?: string }> {
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
    const { data, error } = await client.rpc("aarohon_admin_save", {
      action_name: action,
      payload,
    });
    if (error) {
      const message =
        accessError(error.code) ??
        (error.code === "P0001"
          ? error.message
          : error.code === "23505"
            ? "একই slug, নাম বা lesson position আগে থেকে আছে।"
            : error.code === "23514"
              ? checkMessage(error.message)
              : error.code === "23503"
                ? "নির্বাচিত বিষয়, কোর্স বা প্রশ্ন আর পাওয়া যাচ্ছে না।"
                : "সংরক্ষণ হয়নি। প্রয়োজনীয় সব ঘর সঠিকভাবে পূরণ করুন।");
      throw Error(message);
    }
    revalidatePublic();
    revalidatePath("/admin", "layout");
    revalidatePath("/dashboard", "layout");
    return { message: "সংরক্ষিত হয়েছে।", id: data?.id };
  } catch (e) {
    return { error: errorMessage(e) };
  }
}

export async function importQuestions(
  rows: import("./question-csv").ImportQuestion[],
  mapping: Record<string, string>,
  status: string,
): Promise<{
  data?: { imported: number; skipped: number; changed: number };
  error?: string;
}> {
  try {
    const client = await authorized();
    if (
      !Array.isArray(rows) ||
      rows.length < 1 ||
      rows.length > 100 ||
      Buffer.byteLength(JSON.stringify(rows)) > 500000 ||
      Buffer.byteLength(JSON.stringify(mapping)) > 100000 ||
      !["draft", "published"].includes(status)
    )
      throw Error("Import batch ঠিক নেই।");
    const { data, error } = await client.rpc("aarohon_import_questions", {
      rows_json: rows,
      course_map: mapping,
      question_status: status,
    });
    if (error)
      throw Error(
        accessError(error.code) ??
          (error.code === "P0001"
            ? error.message
            : error.code === "PGRST202"
              ? "আগে 008_home_images_csv.sql চালান।"
              : "Import হয়নি। CSV, কোর্স mapping এবং admin access যাচাই করুন।"),
      );
    revalidatePublic();
    revalidatePath("/dashboard", "layout");
    return { data };
  } catch (e) {
    return { error: errorMessage(e) };
  }
}

const statusEntities = {
  course: ["draft", "published", "archived"],
  lesson: ["draft", "published", "archived"],
  question: ["draft", "published", "archived"],
  exam: ["draft", "published", "archived"],
  subject: ["active", "archived"],
  topic: ["active", "archived"],
} as const;
export type StatusEntity = keyof typeof statusEntities;
// Archive/restore only changes visibility, so it works on locked rows too (021).
export async function setAdminStatus(
  entity: StatusEntity,
  id: string,
  status: string,
): Promise<{ error?: string }> {
  try {
    const allowed: readonly string[] | undefined = statusEntities[entity];
    if (!allowed?.includes(status)) throw Error("Invalid status");
    const client = await authorized();
    const { error } = await client.rpc("aarohon_admin_status", {
      entity,
      ident: id,
      new_status: status,
    });
    if (error)
      throw Error(
        accessError(error.code) ??
          (error.code === "P0001"
            ? error.message
            : error.code === "PGRST202"
              ? "আগে 021_archive_status.sql চালান।"
              : "অবস্থা পরিবর্তন হয়নি। আবার চেষ্টা করুন।"),
      );
    revalidatePublic();
    revalidatePath("/admin", "layout");
    revalidatePath("/dashboard", "layout");
    return {};
  } catch (e) {
    return { error: errorMessage(e) };
  }
}

// Permanent delete of an archived row; the database refuses if student history exists (022).
export async function deleteAdminRow(
  entity: StatusEntity,
  id: string,
): Promise<{ error?: string }> {
  try {
    if (!(entity in statusEntities)) throw Error("Invalid entity");
    const client = await authorized();
    const { error } = await client.rpc("aarohon_admin_delete", {
      entity,
      ident: id,
    });
    if (error)
      throw Error(
        accessError(error.code) ??
          (error.code === "P0001"
            ? error.message
            : error.code === "PGRST202"
              ? "আগে 022_admin_delete.sql চালান।"
              : "মুছে ফেলা যায়নি। আবার চেষ্টা করুন।"),
      );
    revalidatePublic();
    revalidatePath("/admin", "layout");
    revalidatePath("/dashboard", "layout");
    return {};
  } catch (e) {
    return { error: errorMessage(e) };
  }
}
