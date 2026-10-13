"use server";
import { serverClient } from "@/lib/supabase/server";
import type { ExamItem } from "./types";
import type { BuilderTopic, ExamPreviewData } from "./exam-builder";
async function call(action: string, payload: Record<string, unknown> = {}) {
  const client = await serverClient();
  const { data, error } = await client.rpc("aarohon_exam_builder", {
    action_name: action,
    payload,
  });
  if (error)
    throw Error(
      ["P0001", "PT401"].includes(error.code)
        ? error.message
        : "লোড হয়নি। Admin access ও 016 migration যাচাই করুন।",
    );
  return data;
}
export async function builderTopics(): Promise<{
  data?: BuilderTopic[];
  error?: string;
}> {
  try {
    return { data: await call("topics") };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "সংযোগের সমস্যা" };
  }
}
export async function generateExamQuestions(
  payload: Record<string, unknown>,
): Promise<{ data?: ExamItem[]; error?: string }> {
  try {
    return { data: await call("generate", payload) };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "সংযোগের সমস্যা" };
  }
}
export async function previewExam(
  payload: Record<string, unknown>,
): Promise<{ data?: ExamPreviewData; error?: string }> {
  try {
    return { data: await call("preview", payload) };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "সংযোগের সমস্যা" };
  }
}
