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
import { Check } from "lucide-react";

export default function ExamDialog() {
  const { data, ready, exam, setExam, answers, setAnswers, submit } =
    useDashboard();
  return (
    <Dialog
      open={!!exam}
      onOpenChange={(open) => {
        if (!open) setExam(null);
      }}
    >
      <DialogContent className="sd-dialog">
        <DialogHeader>
          <DialogTitle>{exam?.title}</DialogTitle>
          <DialogDescription>
            নমুনা পরীক্ষা · প্রতিটি প্রশ্নে ১ নম্বর · উত্তর দিয়ে জমা দিন। বন্ধ
            করলে অসম্পূর্ণ উত্তর সংরক্ষিত হবে না।
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          {exam?.questions.map((id, index) => {
            const q = data.questions.find((x) => x.id === id)!;
            return (
              <fieldset className="sd-exam-question" key={id}>
                <legend>
                  {bn(index + 1)}. {q.text}
                </legend>
                {q.options.map((option, i) => (
                  <label key={option}>
                    <input
                      type="radio"
                      name={id}
                      value={i}
                      checked={answers[id] === i}
                      onChange={() => setAnswers({ ...answers, [id]: i })}
                      required
                    />
                    {option}
                  </label>
                ))}
              </fieldset>
            );
          })}
          <Button className="sd-submit" type="submit" disabled={!ready}>
            উত্তর জমা দিন <Check />
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
