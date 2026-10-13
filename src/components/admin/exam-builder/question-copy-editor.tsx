"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { saveAdmin } from "@/lib/admin/actions";
import type { PreviewQuestion } from "@/lib/admin/exam-builder";
export default function QuestionCopyEditor({
  question: q,
  onClose,
  onSaved,
}: {
  question: PreviewQuestion;
  onClose: () => void;
  onSaved: (id: string, title: string) => void;
}) {
  const [text, setText] = useState(q.text),
    [options, setOptions] = useState(q.options.join("\n")),
    [correct, setCorrect] = useState(q.answer + 1),
    [explanation, setExplanation] = useState(q.explanation),
    [difficulty, setDifficulty] = useState(q.difficulty);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function save() {
    const opts = options.split("\n").map((o) => o.trim());
    if (
      !text.trim() ||
      opts.length < 2 ||
      opts.length > 8 ||
      opts.some((o) => !o) ||
      !Number.isInteger(correct) ||
      correct < 1 ||
      correct > opts.length
    ) {
      setError("প্রশ্ন, ২–৮টি অপশন ও সঠিক উত্তরের নম্বর ঠিক করুন।");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const r = await saveAdmin("question_save", {
        question_text: text,
        topic_id: q.topic_id,
        options: opts,
        correct_index: correct - 1,
        explanation,
        difficulty,
        status: "published",
      });
      if (r.error || !r.id) setError(r.error || "সংরক্ষণ হয়নি।");
      else onSaved(r.id, text);
    } catch {
      setError("সংযোগের সমস্যা। আবার চেষ্টা করুন।");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !busy) onClose();
      }}
    >
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>প্রশ্নের সংশোধিত কপি</DialogTitle>
          <DialogDescription>
            মূল প্রশ্ন ও আগের পরীক্ষার ফলাফল অপরিবর্তিত থাকবে। নতুন published
            প্রশ্ন তৈরি হবে এবং এই editor-এর তালিকায় বসবে। এরপর পরীক্ষাটিও Save
            করুন।
          </DialogDescription>
        </DialogHeader>
        <fieldset disabled={busy} className="ad-form grid gap-3">
          <label>
            প্রশ্ন
            <textarea
              value={text}
              maxLength={10000}
              onChange={(e) => setText(e.target.value)}
            />
          </label>
          <label>
            অপশন — প্রতি লাইনে একটি
            <textarea
              value={options}
              onChange={(e) => setOptions(e.target.value)}
            />
          </label>
          <label>
            সঠিক অপশনের নম্বর
            <input
              type="number"
              min={1}
              max={8}
              value={correct}
              onChange={(e) => setCorrect(Number(e.target.value))}
            />
          </label>
          <label>
            কঠিনতা
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
            >
              <option value="easy">সহজ</option>
              <option value="medium">মাঝারি</option>
              <option value="hard">কঠিন</option>
            </select>
          </label>
          <label>
            ব্যাখ্যা
            <textarea
              value={explanation}
              maxLength={10000}
              onChange={(e) => setExplanation(e.target.value)}
            />
          </label>
          <Button type="button" onClick={save}>
            {busy ? "সংরক্ষণ হচ্ছে…" : "কপি তৈরি করে তালিকায় বসান"}
          </Button>
        </fieldset>
        {error && <p role="alert">{error}</p>}
      </DialogContent>
    </Dialog>
  );
}
