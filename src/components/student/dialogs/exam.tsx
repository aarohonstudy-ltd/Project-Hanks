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
  const { session, ready, notice, exam, setExam, answers, setAnswers, submit } =
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
            উত্তর দিয়ে সময়ের মধ্যে জমা দিন। বন্ধ বা রিফ্রেশ করলে অসম্পূর্ণ উত্তর
            হারাবে; পরীক্ষার সময় চলতে থাকবে।
            {session?.deadline && (
              <>
                {" "}
                শেষ সময়: {new Date(session.deadline).toLocaleString("bn-BD")}
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <p role="status">{notice}</p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          {session?.items.map((q, index) => {
            const id = q.id;
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
