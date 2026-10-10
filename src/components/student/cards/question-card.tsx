"use client";
import { useDashboard } from "@/components/student/dashboard-context";
import { bn } from "@/components/student/navigation";
import { Button } from "@/components/ui/button";
import type { Question } from "@/lib/student/types";
import { Bookmark } from "lucide-react";

export default function QuestionCard({ q }: { q: Question }) {
  const { saved, ready, revealed, setRevealed, bookmark } = useDashboard();

  return (
    <article className="sd-panel sd-question" key={q.id}>
      <div className="sd-card-top">
        <span className="sd-chip">{q.subject}</span>
        <Button
          variant="ghost"
          size="icon"
          aria-label={
            saved.bookmarks.includes(q.id) ? "বুকমার্ক সরান" : "বুকমার্ক করুন"
          }
          aria-pressed={saved.bookmarks.includes(q.id)}
          disabled={!ready}
          onClick={() => bookmark(q.id)}
        >
          <Bookmark
            className={
              saved.bookmarks.includes(q.id) ? "fill-current text-primary" : ""
            }
          />
        </Button>
      </div>
      <h3>{q.text}</h3>
      <div className="sd-options-grid">
        {q.options.map((o, i) => (
          <div
            key={o}
            className={`sd-option ${revealed.includes(q.id) && i === q.answer ? "correct" : ""}`}
          >
            <span>{bn(i + 1)}</span>
            {o}
          </div>
        ))}
      </div>
      <Button
        variant="ghost"
        onClick={() =>
          setRevealed(
            revealed.includes(q.id)
              ? revealed.filter((x) => x !== q.id)
              : [...revealed, q.id],
          )
        }
      >
        {revealed.includes(q.id) ? "ব্যাখ্যা লুকান" : "উত্তর ও ব্যাখ্যা দেখুন"}
      </Button>
      {revealed.includes(q.id) && (
        <p className="sd-explanation">{q.explanation}</p>
      )}
    </article>
  );
}
