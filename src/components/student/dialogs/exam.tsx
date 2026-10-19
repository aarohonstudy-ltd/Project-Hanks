"use client";
import { useEffect, useRef, useState } from "react";
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
import PracticeQuestion from "./practice-question";
import { Check, ShieldCheck } from "lucide-react";
export default function ExamDialog() {
  const { session, ready, notice, exam, setExam, submit, begin, finishExam } =
    useDashboard();
  const [starting, setStarting] = useState(false),
    [error, setError] = useState("");
  const [practicePending, setPracticePending] = useState(0);
  const locked = !!session && !session.practice;
  async function start() {
    if (!exam) return;
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
          setError("");
        }
      }}
    >
      <DialogContent
        fullScreen={!!session?.isLive && !session.practice}
        className={`sd-dialog${session?.isLive && !session.practice ? " sd-live-exam-page" : ""}`}
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
              ? "উত্তর দিলেই সঠিক উত্তর ও ব্যাখ্যা দেখুন। Fullscreen প্রয়োজন নেই।"
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
                <li>একবার উত্তর নির্বাচন করলে আর পরিবর্তন করা যাবে না।</li>
                <li>
                  অন্য tab/app/window-এ গেলে বা Fullscreen ছাড়লে সতর্কবার্তা
                  পাবেন।
                </li>
                <li>দ্বিতীয়বার পরীক্ষা ছাড়লে উত্তর auto-submit হবে।</li>
                <li>সময় শেষে server-এ সংরক্ষিত উত্তর দিয়ে জমা হবে।</li>
                <li>ফোন কল বা browser-এর বাইরে যাওয়া একইভাবে গণনা হতে পারে।</li>
              </ul>
            </div>
            {(error || notice) && (
              <p role="alert" className="text-destructive">
                {error || notice}
              </p>
            )}
            {/* Starting the exam counts as accepting the rules above. */}
            <Button
              size="lg"
              className="sd-exam-start"
              disabled={!ready || starting}
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
              <PracticeQuestion
                key={`${session.attemptId}:${q.id}`}
                question={q}
                number={n + 1}
                session={session}
                onBusy={(busy) =>
                  setPracticePending((count) =>
                    Math.max(0, count + (busy ? 1 : -1)),
                  )
                }
              />
            ))}
            <div className="sd-exam-footer">
              <Button
                className="sd-submit"
                type="submit"
                disabled={!ready || practicePending > 0}
              >
                উত্তর জমা দিন <Check />
              </Button>
            </div>
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
  // After submission, return to the dashboard on its own.
  const doneRef = useRef(state.done);
  useEffect(() => {
    doneRef.current = state.done;
  });
  useEffect(() => {
    if (!state.finished) return;
    const timer = setTimeout(() => doneRef.current(), 1500);
    return () => clearTimeout(timer);
  }, [state.finished]);
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
      {state.error && (
        <p
          role="alert"
          className="rounded-xl border border-destructive/40 p-3 text-destructive"
        >
          {state.error}
        </p>
      )}
      {state.finished ? (
        <div role="status" className="sd-exam-done">
          <p>{state.message}</p>
          <p>ড্যাশবোর্ডে নিয়ে যাওয়া হচ্ছে…</p>
          <Button size="lg" onClick={state.done}>
            ড্যাশবোর্ডে ফিরুন
          </Button>
        </div>
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
              className="min-w-0 space-y-4 disabled:opacity-60"
            >
              {session.items.map((q, n) => (
                <fieldset key={q.id} className="sd-exam-question">
                  <legend>
                    {bn(n + 1)}. {q.text}
                  </legend>
                  {session.isLive && state.answers[q.id] !== undefined && (
                    <p className="text-xs text-muted-foreground">
                      উত্তর লক হয়েছে — পরিবর্তন করা যাবে না।
                    </p>
                  )}
                  {q.options.map((o, i) => (
                    <label key={i}>
                      <input
                        type="radio"
                        name={q.id}
                        disabled={
                          !!session.isLive && state.answers[q.id] !== undefined
                        }
                        checked={state.answers[q.id] === i}
                        onChange={() => state.choose(q.id, i)}
                      />
                      <span className="min-w-0 flex-1 whitespace-pre-wrap break-words">
                        {o}
                      </span>
                    </label>
                  ))}
                </fieldset>
              ))}
            </fieldset>
          )}
          <div className="sd-exam-footer">
            {confirm && !state.stopped ? (
              <div className="sd-exam-confirm">
                <p>
                  {bn(session.items.length - answered)}টি প্রশ্নের উত্তর বাকি।
                  এখন জমা দেবেন?
                </p>
                <div>
                  <Button size="lg" onClick={state.submit}>
                    হ্যাঁ, জমা দিন
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => setConfirm(false)}
                  >
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
          </div>
        </>
      )}
    </div>
  );
}
