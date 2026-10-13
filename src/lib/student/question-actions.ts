"use server";
import { serverClient } from "@/lib/supabase/server";
import type { Question } from "./types";
export type QuestionPage = {
  rows: Question[];
  total: number;
  page: number;
  subjects: string[];
};
export type SubjectStat = { subject: string; total: number; correct: number };
export async function loadQuestions(
  mode: string,
  search = "",
  subject = "",
  page = 1,
  ids: string[] = [],
): Promise<{ data?: QuestionPage; error?: string }> {
  const client = await serverClient();
  const { data, error } = await client.rpc("aarohon_questions", {
    mode,
    search_text: search,
    subject_name: subject === "সব বিষয়" ? "" : subject,
    page_number: page,
    question_ids: ids,
  });
  return error
    ? {
        error:
          error.code === "PT401"
            ? "সেশন শেষ হয়েছে। আবার লগইন করুন।"
            : "প্রশ্ন লোড হয়নি। আবার চেষ্টা করুন।",
      }
    : { data };
}
export async function loadSubjectStats(): Promise<{
  data?: SubjectStat[];
  error?: string;
}> {
  const client = await serverClient();
  const { data, error } = await client.rpc("aarohon_subject_stats");
  return error ? { error: "পরিসংখ্যান লোড হয়নি। আবার চেষ্টা করুন।" } : { data };
}
