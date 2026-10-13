"use client";
import { useState } from "react";
import QuestionCard from "@/components/student/cards/question-card";
import { useDashboard } from "@/components/student/dashboard-context";
import { useQuestionPage } from "../hooks/use-question-page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Play, Search } from "lucide-react";
export default function QuestionListSection({
  mode,
}: {
  mode: "questions" | "bookmarks" | "mistakes" | "practice";
}) {
  const { saved, ready, start } = useDashboard();
  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState("");
  const [page, setPage] = useState(1);
  const result = useQuestionPage(
    mode,
    query,
    subject,
    page,
    [],
    mode === "bookmarks" ? saved.bookmarks.join(",") : "",
  );
  const rows = result.data?.rows ?? [];
  const subjects = result.data?.subjects ?? result.previous?.subjects ?? [];
  return (
    <>
      <div className="sd-filter">
        <div className="sd-search">
          <Search size={18} />
          <Input
            aria-label="প্রশ্ন খুঁজুন"
            placeholder="প্রশ্ন খুঁজুন…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <select
          aria-label="বিষয় নির্বাচন"
          value={subject}
          onChange={(e) => {
            setSubject(e.target.value);
            setPage(1);
          }}
        >
          <option value="">সব বিষয়</option>
          {subjects.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        {mode === "practice" && (
          <Button
            disabled={!ready || !rows.length || result.loading}
            onClick={() =>
              start({
                id: "practice",
                title: `${subject || "সব বিষয়"} • প্র্যাকটিস`,
                subject,
                kind: "free",
                date: "",
                questions: rows.map((q) => q.id),
              })
            }
          >
            এই পৃষ্ঠার প্রশ্ন দিয়ে প্র্যাকটিস <Play />
          </Button>
        )}
      </div>
      {mode === "mistakes" && (
        <p className="sd-info">
          সম্পন্ন পরীক্ষার ভুল অথবা উত্তর না দেওয়া প্রশ্নগুলো এখানে দেখানো
          হচ্ছে।
        </p>
      )}
      {result.loading && <p role="status">প্রশ্ন লোড হচ্ছে…</p>}
      {result.error && (
        <p role="alert">
          {result.error}{" "}
          <Button variant="outline" onClick={result.retry}>
            আবার চেষ্টা
          </Button>
        </p>
      )}
      <div className="sd-question-list">
        {rows.map((q) => (
          <QuestionCard key={q.id} q={q} />
        ))}
      </div>
      {result.data && (
        <div className="sd-filter" style={{ marginTop: 20 }}>
          <Button
            variant="outline"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            আগের পৃষ্ঠা
          </Button>
          <span>
            পৃষ্ঠা {page} · মোট {result.data.total}টি প্রশ্ন
          </span>
          <Button
            variant="outline"
            disabled={page * 20 >= result.data.total}
            onClick={() => setPage(page + 1)}
          >
            পরের পৃষ্ঠা
          </Button>
        </div>
      )}
      {result.data && !rows.length && (
        <p className="sd-empty">
          কোনো প্রশ্ন পাওয়া যায়নি। সার্চ বা বিষয় পরিবর্তন করুন।
        </p>
      )}
    </>
  );
}
