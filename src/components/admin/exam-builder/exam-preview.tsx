"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { previewExam } from "@/lib/admin/exam-builder-actions";
import {
  gradeDemo,
  type ExamSettings,
  type ExamPreviewData,
  type PreviewQuestion,
} from "@/lib/admin/exam-builder";
import type { ExamItem } from "@/lib/admin/types";
import QuestionCopyEditor from "./question-copy-editor";
export default function ExamPreview({
  examId,
  items,
  settings,
  onClose,
  onReplace,
}: {
  examId?: string;
  items?: ExamItem[];
  settings?: ExamSettings;
  onClose: () => void;
  onReplace?: (oldId: string, newId: string, title: string) => void;
}) {
  const key = JSON.stringify(examId ? { examId } : { items });
  const [loaded, setLoaded] = useState<{
    key: string;
    data?: ExamPreviewData;
    error?: string;
  }>();
  const [retry, setRetry] = useState(0),
    [demo, setDemo] = useState(false),
    [editing, setEditing] = useState<PreviewQuestion>();
  useEffect(() => {
    let active = true;
    void previewExam(JSON.parse(key))
      .then((r) => {
        if (active) setLoaded({ key, ...r });
      })
      .catch(() => {
        if (active) setLoaded({ key, error: "সংযোগের সমস্যা।" });
      });
    return () => {
      active = false;
    };
  }, [key, retry]);
  const current = loaded?.key === key ? loaded : undefined;
  const questions = current?.data?.questions ?? [];
  const config = current?.data?.exam ??
    settings ?? {
      title: "পরীক্ষার খসড়া",
      exam_type: "model_test",
      duration_minutes: 30,
      pass_mark: 0,
    };
  return (
    <Dialog
      open
      onOpenChange={(o) => {
        if (!o && !editing) onClose();
      }}
    >
      <DialogContent className="max-h-[94dvh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            {config.title || "পরীক্ষার খসড়া"} · {demo ? "Demo exam" : "Preview"}
          </DialogTitle>
          <DialogDescription>
            Admin preview/demo। Demo attempt, উত্তর বা result database-এ সংরক্ষণ
            হয় না। বন্ধ করলে demo মুছে যায়।
          </DialogDescription>
        </DialogHeader>
        {!current && <p role="status">প্রশ্ন লোড হচ্ছে…</p>}
        {current?.error && (
          <p role="alert">
            {current.error}{" "}
            <Button type="button" onClick={() => setRetry(retry + 1)}>
              আবার চেষ্টা
            </Button>
          </p>
        )}
        {current?.data &&
          (demo ? (
            <DemoExam
              key={key}
              questions={questions}
              settings={config}
              onBack={() => setDemo(false)}
            />
          ) : (
            <>
              <div className="ad-preview-summary">
                <span>{questions.length}টি প্রশ্ন</span>
                <span>মোট নম্বর: {gradeDemo(questions, {}).total}</span>
                <span>সময়: {config.duration_minutes} মিনিট</span>
                <span>পাস: {config.pass_mark || "নির্ধারিত নয়"}</span>
              </div>
              <Button
                type="button"
                disabled={
                  !questions.length ||
                  !Number.isFinite(config.duration_minutes) ||
                  config.duration_minutes < 1
                }
                onClick={() => setDemo(true)}
              >
                Demo পরীক্ষা শুরু করুন
              </Button>
              {!questions.length && <p>আগে প্রশ্ন যোগ করুন।</p>}
              {questions.map((q, i) => (
                <article key={q.id} className="ad-preview-question">
                  <small>
                    {q.subject} · {q.difficulty} · {q.status} · +{q.marks} / −
                    {q.negative_marks}
                  </small>
                  <h3>
                    {i + 1}. {q.text}
                  </h3>
                  <ol>
                    {q.options.map((o, j) => (
                      <li
                        key={j}
                        className={j === q.answer ? "ad-correct" : ""}
                      >
                        {j + 1}. {o} {j === q.answer && "✓"}
                      </li>
                    ))}
                  </ol>
                  <p className="whitespace-pre-wrap">{q.explanation}</p>
                  {onReplace && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setEditing(q)}
                    >
                      সম্পাদনা · নতুন কপি
                    </Button>
                  )}
                </article>
              ))}
            </>
          ))}
        {editing && (
          <QuestionCopyEditor
            question={editing}
            onClose={() => setEditing(undefined)}
            onSaved={(id, title) => {
              onReplace?.(editing.id, id, title);
              setEditing(undefined);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
function DemoExam({
  questions,
  settings,
  onBack,
}: {
  questions: PreviewQuestion[];
  settings: ExamSettings;
  onBack: () => void;
}) {
  const [answers, setAnswers] = useState<Record<string, number>>({}),
    [index, setIndex] = useState(0),
    [submitted, setSubmitted] = useState(false);
  const [deadline] = useState(
    () => Date.now() + settings.duration_minutes * 60000,
  );
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(timer);
  }, []);
  const remaining = Math.max(0, Math.ceil((deadline - now) / 1000));
  const finished = submitted || remaining === 0,
    q = questions[index];
  const result = gradeDemo(questions, answers);
  return (
    <div className="grid gap-4">
      <div className="ad-preview-summary">
        <strong>
          {finished
            ? "Demo শেষ"
            : `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}`}
        </strong>
        <span>
          উত্তর: {Object.keys(answers).length}/{questions.length}
        </span>
        <Button type="button" variant="outline" onClick={onBack}>
          Preview-তে ফিরুন
        </Button>
      </div>
      {finished && (
        <div role="status" className="ad-demo-result">
          <h3>
            Demo ফলাফল · {result.score} / {result.total}
          </h3>
          <p>
            সঠিক {result.correct} · ভুল {result.wrong} · অনুত্তরিত{" "}
            {result.skipped}
          </p>
          {settings.pass_mark > 0 && (
            <p>{result.score >= settings.pass_mark ? "পাস" : "ফেল"}</p>
          )}
          <p>এই ফলাফল কোথাও save হয়নি।</p>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {questions.map((item, i) => (
          <Button
            type="button"
            key={item.id}
            size="sm"
            variant={index === i ? "default" : "outline"}
            aria-label={`প্রশ্ন ${i + 1}${answers[item.id] !== undefined ? ", উত্তর দেওয়া হয়েছে" : ""}`}
            onClick={() => setIndex(i)}
          >
            {i + 1}
            {answers[item.id] !== undefined ? " ✓" : ""}
          </Button>
        ))}
      </div>
      {q && (
        <article className="ad-preview-question">
          <h3>
            {index + 1}. {q.text}
          </h3>
          <p>
            নম্বর {q.marks} · ভুলে কর্তন {q.negative_marks}
          </p>
          <div className="grid gap-2">
            {q.options.map((option, i) => (
              <button
                key={i}
                type="button"
                className={`ad-demo-option ${answers[q.id] === i ? "selected" : ""} ${finished && q.answer === i ? "ad-correct" : ""}`}
                disabled={
                  finished ||
                  (settings.exam_type === "live" && answers[q.id] !== undefined)
                }
                aria-pressed={answers[q.id] === i}
                onClick={() => {
                  if (Date.now() < deadline)
                    setAnswers((a) => ({ ...a, [q.id]: i }));
                }}
              >
                {i + 1}. {option}
                {finished && q.answer === i && " ✓ সঠিক"}
              </button>
            ))}
          </div>
          {settings.exam_type === "live" && !finished && (
            <p className="ad-hint">
              Live mode: একবার নির্বাচন করলে পরিবর্তন করা যাবে না।
            </p>
          )}
          {finished && (
            <p className="whitespace-pre-wrap">
              আপনার উত্তর: {q.options[answers[q.id]] ?? "উত্তর দেওয়া হয়নি"}
              <br />
              ব্যাখ্যা: {q.explanation}
            </p>
          )}
        </article>
      )}
      <div className="flex justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={index === 0}
          onClick={() => setIndex(index - 1)}
        >
          আগের
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={index === questions.length - 1}
          onClick={() => setIndex(index + 1)}
        >
          পরের
        </Button>
        {!finished && (
          <Button type="button" onClick={() => setSubmitted(true)}>
            Demo জমা দিন
          </Button>
        )}
      </div>
    </div>
  );
}
