"use client";
import { useEffect, useState } from "react";
import {
  loadQuestions,
  type QuestionPage,
} from "@/lib/student/question-actions";
import { readCache, writeCache } from "@/lib/client-cache";
export function useQuestionPage(
  mode: string,
  search: string,
  subject: string,
  page: number,
  ids: string[] = [],
  revision = "",
) {
  const [retry, setRetry] = useState(0);
  // Same query without the retry counter: a revisit shows this cached page at once.
  const cacheKey = `questions:${JSON.stringify([mode, search, subject, page, ids, revision])}`;
  const cached = readCache<QuestionPage>(cacheKey);
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
    // Debounce typing, but refresh a cached page immediately.
    const delay = readCache(cacheKey) ? 0 : 250;
    const timer = setTimeout(() => {
      void loadQuestions(m, q, s, p, questionIds)
        .then((r) => {
          if (r.data) writeCache(cacheKey, r.data);
          if (!cancelled) setResult({ key, ...r });
        })
        .catch(() => {
          if (!cancelled)
            setResult({ key, error: "সংযোগের সমস্যা। আবার চেষ্টা করুন।" });
        });
    }, delay);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [key, cacheKey]);
  return {
    // A failed refresh keeps showing the cached page.
    data: result?.key === key ? (result.data ?? cached) : cached,
    previous: result?.data,
    error: result?.key === key ? result.error : undefined,
    loading: result?.key !== key && !cached,
    retry: () => setRetry((v) => v + 1),
  };
}
