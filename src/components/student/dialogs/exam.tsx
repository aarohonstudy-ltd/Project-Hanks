"use client";
import { useState } from "react";
import { useDashboard } from "@/components/student/dashboard-context";
import { useExamSession } from "@/components/student/hooks/use-exam-session";
import type { Session } from "@/lib/student/actions";
import { bn } from "@/components/student/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Check, ShieldCheck } from "lucide-react";
export default function ExamDialog() {
  const {
    session,
    ready,
    notice,
    exam,
    setExam,
    answers,
    setAnswers,
    submit,
    begin,
    finishExam,
  } = useDashboard();
  const [agreed, setAgreed] = useState(false),
    [starting, setStarting] = useState(false),
    [error, setError] = useState("");
  const locked = !!session && !session.practice;
  async function start() {
    if (!exam || !agreed) return;
    setStarting(true);
    setError("");
    try {
      if (!document.documentElement.requestFullscreen)
        throw Error(
          "এই browser Fullscreen সমর্থন করে না। Chrome/Edge/Firefox-এর সমর্থিত browser ব্যবহার করুন।",
        );
      await document.documentElement.requestFullscreen();
      const result = await begin(exam, true);
      if (!result && document.fullscreenElement)
        await document.exitFullscreen();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Fullscreen চালু হয়নি। আবার চেষ্টা করুন।",
      );
    } finally {
      setStarting(false);
    }
  }
  return (
    <Dialog
      open={!!exam}
      onOpenChange={(open) => {
        if (!open && !locked && !starting) {
          setExam(null);
          setAgreed(false);
          setError("");
        }
      }}
    >
      <DialogContent
        className="sd-dialog"
        showCloseButton={!locked && !starting}
        onEscapeKeyDown={(e) => {
          if (locked || starting) e.preventDefault();
        }}
        onInteractOutside={(e) => {
          if (locked || starting) e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>{session?.title ?? exam?.title}</DialogTitle>
          <DialogDescription>
            {session?.practice
              ? "অনুশীলনের উত্তর দিয়ে জমা দিন।"
              : "সময় server অনুযায়ী চলবে। সংরক্ষিত উত্তরসহ একই পরীক্ষায় ফিরে আসতে পারবেন।"}
          </DialogDescription>
        </DialogHeader>
        {!session ? (
          <div className="space-y-4">
            <div className="rounded-xl border bg-muted/50 p-4">
              <ShieldCheck className="mb-3 size-7 text-primary" />
              <p className="font-semibold">লাইভ পরীক্ষার নিয়ম</p>
              <ul className="mt-3 list-inside list-disc space-y-2 leading-7">
                <li>Fullscreen চালু করে পরীক্ষা শুরু হবে।</li>
                <li>
                  অন্য tab/app/window-এ গেলে বা Fullscreen ছাড়লে সতর্কবার্তা
                  পাবেন।
                </li>
                <li>দ্বিতীয়বার পরীক্ষা ছাড়লে উত্তর auto-submit হবে।</li>
                <li>সময় শেষে server-এ সংরক্ষিত উত্তর দিয়ে জমা হবে।</li>
                <li>ফোন কল বা browser-এর বাইরে যাওয়া একইভাবে গণনা হতে পারে।</li>
              </ul>
            </div>
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-1"
              />
              নিয়মগুলো পড়েছি এবং সম্মত।
            </label>
            {(error || notice) && (
              <p role="alert" className="text-destructive">
                {error || notice}
              </p>
            )}
            <Button
              disabled={!agreed || !ready || starting}
              onClick={() => void start()}
            >
              {starting
                ? "পরীক্ষা প্রস্তুত হচ্ছে…"
                : "Fullscreen-এ পরীক্ষা শুরু করুন"}
            </Button>
          </div>
        ) : session.practice ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void submit();
            }}
          >
            <p role="status">{notice}</p>
            {session.items.map((q, n) => (
              <fieldset key={q.id} className="sd-exam-question">
                <legend>
                  {bn(n + 1)}. {q.text}
                </legend>
                {q.options.map((o, i) => (
                  <label key={i}>
                    <input
                      type="radio"
                      name={q.id}
                      checked={answers[q.id] === i}
                      onChange={() => setAnswers({ ...answers, [q.id]: i })}
                    />
                    {o}
                  </label>
                ))}
              </fieldset>
            ))}
            <Button className="sd-submit" type="submit" disabled={!ready}>
              উত্তর জমা দিন <Check />
            </Button>
          </form>
        ) : (
          <ActiveExam
            key={session.attemptId}
            session={session}
            onDone={finishExam}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
function ActiveExam({
  session,
  onDone,
}: {
  session: Session;
  onDone: () => void;
}) {
  const state = useExamSession(session, onDone),
    [confirm, setConfirm] = useState(false);
  const answered = Object.keys(state.answers).length;
  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-10 flex flex-wrap justify-between gap-3 rounded-xl border bg-background p-4">
        <p className="font-semibold" role="timer" aria-label="বাকি সময়">
          বাকি {bn(Math.floor(state.remaining / 60))}:
          {String(state.remaining % 60).padStart(2, "0")}
        </p>
        <p>
          {bn(answered)} / {bn(session.items.length)} উত্তর
          {session.isLive ? ` · সতর্কতা ${bn(state.warnings)}/২` : ""}
        </p>
      </div>
      <p role="status" className="text-sm">
        {state.message}
      </p>
      {state.error && (
        <p
          role="alert"
          className="rounded-xl border border-destructive/40 p-3 text-destructive"
        >
          {state.error}
        </p>
      )}
      {state.finished ? (
        <Button onClick={state.done}>ড্যাশবোর্ডে ফিরুন</Button>
      ) : (
        <>
          {(!state.armed || state.warning) && !state.stopped ? (
            <div
              role="alert"
              className="space-y-3 rounded-xl border border-amber-500/60 bg-amber-500/10 p-5"
            >
              <p className="font-semibold">
                {state.warning
                  ? "প্রথম সতর্কবার্তা: পরীক্ষা ছেড়েছেন। আবার হলে auto-submit হবে।"
                  : "চলমান পরীক্ষায় ফিরে এসেছেন। আগের সময় ও উত্তর বহাল আছে।"}
              </p>
              <p>Fullscreen-এ থাকুন; tab/app/window পরিবর্তন করবেন না।</p>
              <Button onClick={() => void state.resume()}>
                Fullscreen-এ পরীক্ষা চালিয়ে যান
              </Button>
            </div>
          ) : null}
          {state.armed && (
            <fieldset
              disabled={state.warning || state.stopped}
              className="space-y-4 disabled:opacity-60"
            >
              {session.items.map((q, n) => (
                <fieldset key={q.id} className="sd-exam-question">
                  <legend>
                    {bn(n + 1)}. {q.text}
                  </legend>
                  {q.options.map((o, i) => (
                    <label key={i}>
                      <input
                        type="radio"
                        name={q.id}
                        checked={state.answers[q.id] === i}
                        onChange={() => state.choose(q.id, i)}
                      />
                      {o}
                    </label>
                  ))}
                </fieldset>
              ))}
            </fieldset>
          )}
          {confirm && !state.stopped ? (
            <div className="space-y-3 rounded-xl border p-4">
              <p>
                {bn(session.items.length - answered)}টি প্রশ্নের উত্তর বাকি। এখন
                জমা দেবেন?
              </p>
              <div className="flex gap-3">
                <Button onClick={state.submit}>হ্যাঁ, জমা দিন</Button>
                <Button variant="outline" onClick={() => setConfirm(false)}>
                  ফিরে যান
                </Button>
              </div>
            </div>
          ) : (
            <Button
              className="sd-submit"
              disabled={state.stopped || !state.armed || state.warning}
              onClick={() => setConfirm(true)}
            >
              উত্তর জমা দিন <Check />
            </Button>
          )}
        </>
      )}
    </div>
  );
}
