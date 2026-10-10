"use client";
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
  const { data, saved, ready, review, setReview, bookmark } = useDashboard();
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
              <span>সঠিক উত্তর</span>
            </div>
            {review.questionIds.map((id) => {
              const q = data.questions.find((x) => x.id === id)!;
              const ok = review.answers[id] === q.answer;
              return (
                <div className="sd-review-question" key={id}>
                  <span className={`sd-chip ${ok ? "green" : "rose"}`}>
                    {ok ? "সঠিক" : "আবার পড়ুন"}
                  </span>
                  <h3>{q.text}</h3>
                  <p>
                    আপনার উত্তর:{" "}
                    {q.options[review.answers[id]] ?? "উত্তর দেওয়া হয়নি"}
                  </p>
                  <strong>সঠিক উত্তর: {q.options[q.answer]}</strong>
                  <p>{q.explanation}</p>
                  <Button
                    variant="outline"
                    disabled={!ready}
                    onClick={() => bookmark(id)}
                  >
                    <Bookmark />
                    {saved.bookmarks.includes(id)
                      ? "বুকমার্ক সরান"
                      : "বুকমার্ক করুন"}
                  </Button>
                </div>
              );
            })}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
