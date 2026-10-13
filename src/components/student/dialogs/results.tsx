"use client";
import { useState } from "react";
import { useQuestionPage } from "../hooks/use-question-page";
import type { Attempt } from "@/lib/student/types";
import { useDashboard } from "@/components/student/dashboard-context";
import { bn } from "@/components/student/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Bookmark, Trophy } from "lucide-react";

export default function ResultsDialog() {
  const { review, setReview } = useDashboard();
  return (
    <Dialog
      open={!!review}
      onOpenChange={(open) => {
        if (!open) setReview(null);
      }}
    >
      <DialogContent className="sd-dialog">
        <DialogHeader>
          <DialogTitle>পরীক্ষার ফলাফল</DialogTitle>
          <DialogDescription>
            {review?.title} · {review?.date}
          </DialogDescription>
        </DialogHeader>
        {review && (
          <>
            <div className="sd-score-banner">
              <Trophy />
              <strong>
                {bn(review.score)} / {bn(review.total)}
              </strong>
              <span>
                সঠিক উত্তর
                {review.marks !== undefined &&
                  ` · প্রাপ্ত নম্বর: ${review.marks}`}
              </span>
            </div>
            <ReviewQuestions key={review.id} review={review} />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ReviewQuestions({ review }: { review: Attempt }) {
  const { saved, ready, bookmark } = useDashboard();
  const [page, setPage] = useState(1);
  const result = useQuestionPage("review", "", "", page, review.questionIds);
  return (
    <>
      {result.loading && <p role="status">উত্তর ও ব্যাখ্যা লোড হচ্ছে…</p>}
      {result.error && (
        <p role="alert">
          {result.error} <Button onClick={result.retry}>আবার চেষ্টা</Button>
        </p>
      )}
      {(result.data?.rows ?? []).map((q) => {
        const id = q.id;
        const ok = review.answers[id] === q.answer;
        return (
          <div className="sd-review-question" key={id}>
            <span className={`sd-chip ${ok ? "green" : "rose"}`}>
              {ok ? "সঠিক" : "আবার পড়ুন"}
            </span>
            <h3>{q.text}</h3>
            <p>
              আপনার উত্তর: {q.options[review.answers[id]] ?? "উত্তর দেওয়া হয়নি"}
            </p>
            <strong>সঠিক উত্তর: {q.options[q.answer]}</strong>
            <p>{q.explanation}</p>
            <Button
              variant="outline"
              disabled={!ready}
              onClick={() => bookmark(id)}
            >
              <Bookmark />
              {saved.bookmarks.includes(id) ? "বুকমার্ক সরান" : "বুকমার্ক করুন"}
            </Button>
          </div>
        );
      })}
      {result.data && (
        <div className="sd-filter">
          <Button
            variant="outline"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            আগের পৃষ্ঠা
          </Button>
          <span>
            পৃষ্ঠা {page} · উপলব্ধ প্রশ্ন {result.data.total}টি
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
      {result.data && result.data.total < review.questionIds.length && (
        <p>কিছু প্রশ্নের ব্যাখ্যা এখনও প্রকাশিত হয়নি বা আর উপলব্ধ নেই।</p>
      )}
    </>
  );
}
