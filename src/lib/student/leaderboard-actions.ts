"use server";
import { serverClient } from "@/lib/supabase/server";
import type { LeaderboardData } from "./leaderboard";
export async function loadLeaderboard(
  examId: string | null = null,
  search = "",
  page = 1,
): Promise<{ data?: LeaderboardData; error?: string }> {
  try {
    const client = await serverClient();
    const { data, error } = await client
      .rpc("aarohon_exam_leaderboard", {
        exam_id: examId,
        search_text: search.slice(0, 120),
        page_number: Math.max(1, page),
      })
      .abortSignal(AbortSignal.timeout(15000));
    if (error)
      return {
        error:
          error.code === "PGRST202"
            ? "লিডারবোর্ড চালু করতে Supabase-এ 007_exam_leaderboard.sql চালান।"
            : error.code === "P0001"
              ? error.message
              : "লিডারবোর্ড লোড হয়নি। সংযোগ ও লগইন যাচাই করে আবার চেষ্টা করুন।",
      };
    return { data: data as LeaderboardData };
  } catch {
    return { error: "লিডারবোর্ডের সংযোগে সমস্যা হয়েছে। আবার চেষ্টা করুন।" };
  }
}
