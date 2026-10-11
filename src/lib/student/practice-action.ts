"use server";
import { serverClient } from "@/lib/supabase/server";
export async function answerPractice(
  attemptId: string,
  questionId: string,
  index: number,
): Promise<{
  answer?: number;
  selected?: number;
  explanation?: string;
  error?: string;
}> {
  try {
    const client = await serverClient();
    const { data, error } = await client.rpc("aarohon_practice_answer", {
      attempt_ident: attemptId,
      question_ident: questionId,
      option_index: index,
    });
    if (error)
      return { error: "উত্তর যাচাই হয়নি। সংযোগ দেখে আবার চেষ্টা করুন।" };
    return data;
  } catch {
    return { error: "সংযোগ করা যায়নি। আবার চেষ্টা করুন।" };
  }
}
