"use client";
import QuestionCard from "@/components/student/cards/question-card";
import { useDashboard } from "@/components/student/dashboard-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bookmark, Play, Search } from "lucide-react";
import Link from "next/link";
export default function QuestionListSection({
  mode,
}: {
  mode: "questions" | "bookmarks" | "mistakes" | "practice";
}) {
  const {
    data,
    saved,
    ready,
    query,
    setQuery,
    subject,
    setSubject,
    wrongIds,
    start,
  } = useDashboard();
  const filteredQuestions = data.questions.filter(
    (q) =>
      (subject === "সব বিষয়" || q.subject === subject) &&
      q.text.toLowerCase().includes(query.toLowerCase()) &&
      (mode !== "bookmarks" || saved.bookmarks.includes(q.id)) &&
      (mode !== "mistakes" || wrongIds.includes(q.id)),
  );
  return (
    <>
      <div className="sd-filter">
        <div className="sd-search">
          <Search size={18} />
          <Input
            aria-label="প্রশ্ন খুঁজুন"
            placeholder="প্রশ্ন খুঁজুন…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <select
          aria-label="বিষয় নির্বাচন"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        >
          {["সব বিষয়", ...new Set(data.questions.map((q) => q.subject))].map(
            (s) => (
              <option key={s}>{s}</option>
            ),
          )}
        </select>
        {mode === "practice" && (
          <Button
            disabled={!ready || !filteredQuestions.length}
            onClick={() =>
              start({
                id: "practice",
                title: `${subject} • প্র্যাকটিস`,
                subject,
                kind: "free",
                date: "",
                questions: filteredQuestions.map((q) => q.id),
              })
            }
          >
            প্র্যাকটিস শুরু করুন <Play />
          </Button>
        )}
      </div>
      {mode === "mistakes" && (
        <p className="sd-info">
          নমুনা ও আপনার সম্পন্ন পরীক্ষার ভুল অথবা উত্তর না দেওয়া প্রশ্নগুলো
          এখানে দেখানো হচ্ছে।
        </p>
      )}
      <div className="sd-question-list">
        {filteredQuestions.map((q) => (
          <QuestionCard key={q.id} q={q} />
        ))}
      </div>
      {!filteredQuestions.length && (
        <div className="sd-empty">
          <Bookmark />
          <h2>কোনো প্রশ্ন পাওয়া যায়নি</h2>
          <p>
            সার্চ বা বিষয় পরিবর্তন করুন, অথবা প্রশ্ন ব্যাংক থেকে প্রশ্ন সংরক্ষণ
            করুন।
          </p>
          <Link href="/dashboard/questions">প্রশ্ন ব্যাংকে যান →</Link>
        </div>
      )}
    </>
  );
}
