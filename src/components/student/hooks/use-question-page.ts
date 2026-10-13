"use client";
import { useEffect, useState } from "react";
import {
  loadQuestions,
  type QuestionPage,
} from "@/lib/student/question-actions";
export function useQuestionPage(
  mode: string,
  search: string,
  subject: string,
  page: number,
  ids: string[] = [],
  revision = "",
) {
  const [retry, setRetry] = useState(0);
  const key = JSON.stringify([
    mode,
    search,
    subject,
    page,
    ids,
    revision,
    retry,
  ]);
  const [result, setResult] = useState<{
    key: string;
    data?: QuestionPage;
    error?: string;
  }>();
  useEffect(() => {
    let cancelled = false;
    const [m, q, s, p, questionIds] = JSON.parse(key);
    const timer = setTimeout(() => {
      void loadQuestions(m, q, s, p, questionIds)
        .then((r) => {
          if (!cancelled) setResult({ key, ...r });
        })
        .catch(() => {
          if (!cancelled)
            setResult({ key, error: "সংযোগের সমস্যা। আবার চেষ্টা করুন।" });
        });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [key]);
  return {
    data: result?.key === key ? result.data : undefined,
    previous: result?.data,
    error: result?.key === key ? result.error : undefined,
    loading: result?.key !== key,
    retry: () => setRetry((v) => v + 1),
  };
}
