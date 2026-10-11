"use client";
import { useRef, useState } from "react";
import { answerPractice } from "@/lib/student/practice-action";
import type { Session } from "@/lib/student/actions";
import type { Question } from "@/lib/student/types";
import { useDashboard } from "../dashboard-context";
import { bn } from "../navigation";
export default function PracticeQuestion({
  question: q,
  number,
  session,
  onBusy,
}: {
  question: Question;
  number: number;
  session: Session;
  onBusy: (busy: boolean) => void;
}) {
  const { setAnswers } = useDashboard();
  const [feedback, setFeedback] = useState<{
      answer: number;
      selected: number;
      explanation: string;
    } | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const lock = useRef(false);
  async function choose(index: number) {
    if (lock.current || feedback) return;
    lock.current = true;
    setBusy(true);
    onBusy(true);
    setError("");
    try {
      const result = await answerPractice(session.attemptId, q.id, index);
      if (
        result.error ||
        result.answer === undefined ||
        result.selected === undefined
      ) {
        setError(result.error || "আবার চেষ্টা করুন।");
        return;
      }
      setFeedback({
        answer: result.answer,
        selected: result.selected,
        explanation: result.explanation || "",
      });
      setAnswers((previous) => ({ ...previous, [q.id]: result.selected! }));
    } finally {
      lock.current = false;
      setBusy(false);
      onBusy(false);
    }
  }
  return (
    <fieldset className="sd-exam-question">
      <legend>
        {bn(number)}. {q.text}
      </legend>
      {q.options.map((option, index) => (
        <label
          key={index}
          className={
            feedback?.answer === index
              ? "!border-green-600 !bg-green-500/10"
              : feedback?.selected === index
                ? "!border-red-500 !bg-red-500/10"
                : ""
          }
        >
          <input
            type="radio"
            name={q.id}
            checked={feedback?.selected === index}
            disabled={busy || !!feedback}
            onChange={() => void choose(index)}
          />
          {option}
        </label>
      ))}
      {busy && <p role="status">উত্তর যাচাই হচ্ছে…</p>}
      {error && (
        <p role="alert" className="text-destructive">
          {error}
        </p>
      )}
      {feedback && (
        <div role="status" className="mt-3 rounded-xl border p-4 space-y-2">
          <strong
            className={
              feedback.selected === feedback.answer
                ? "text-green-700 dark:text-green-400"
                : "text-destructive"
            }
          >
            {feedback.selected === feedback.answer
              ? "✓ সঠিক উত্তর!"
              : "✗ উত্তরটি ভুল"}
          </strong>
          <p>সঠিক উত্তর: {q.options[feedback.answer]}</p>
          <p className="whitespace-pre-wrap">
            {feedback.explanation || "এই প্রশ্নের ব্যাখ্যা এখনো যোগ করা হয়নি।"}
          </p>
        </div>
      )}
    </fieldset>
  );
}
