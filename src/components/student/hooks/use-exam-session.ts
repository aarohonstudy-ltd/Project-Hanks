"use client";
import { useEffect, useRef, useState } from "react";
import type { Session } from "@/lib/student/actions";
import {
  FocusEpisode,
  mergeDrafts,
  type DraftAnswer,
  type FocusEvent,
  type ExamSync,
} from "@/lib/student/exam-client";
export function useExamSession(session: Session, onDone: () => void) {
  const [answers, setAnswers] = useState(session.answers ?? {}),
    [remaining, setRemaining] = useState(0);
  const [message, setMessage] = useState("সংরক্ষিত উত্তর প্রস্তুত হচ্ছে…"),
    [error, setError] = useState("");
  const [warnings, setWarnings] = useState(session.warnings ?? 0),
    [warning, setWarning] = useState(false);
  const [armed, setArmed] = useState(
    !session.isLive ||
      (typeof document !== "undefined" && !!document.fullscreenElement),
  );
  const [stopped, setStopped] = useState(false),
    [finished, setFinished] = useState(false);
  const doneRef = useRef(onDone);
  const operations = useRef<{
    choose: (id: string, index: number) => void;
    submit: () => void;
    resume: () => Promise<void>;
  }>({ choose: () => {}, submit: () => {}, resume: async () => {} });
  useEffect(() => {
    doneRef.current = onDone;
  }, [onDone]);
  useEffect(() => {
    const key = `aarohon-exam-${session.attemptId}`;
    let cached: {
      answers?: Record<string, DraftAnswer>;
      events?: FocusEvent[];
      submit?: boolean;
    } = {};
    try {
      cached = JSON.parse(localStorage.getItem(key) || "{}");
      if (!cached || typeof cached !== "object") cached = {};
    } catch {}
    let drafts = mergeDrafts(
      session.answers ?? {},
      session.revisions ?? {},
      cached.answers ?? {},
      new Set(session.items.map((q) => q.id)),
      !!session.isLive,
    );
    let events = (Array.isArray(cached.events) ? cached.events : [])
      .filter(
        (e) =>
          e &&
          typeof e.id === "string" &&
          !(session.eventIds ?? []).includes(e.id) &&
          ["hidden", "blur", "fullscreen_exit", "pagehide"].includes(e.kind),
      )
      .slice(0, 2);
    for (const question of session.items) {
      if (
        drafts[question.id] &&
        drafts[question.id].index >= question.options.length
      )
        delete drafts[question.id];
    }
    let serverWarnings = session.warnings ?? 0,
      ack = { ...session.revisions };
    let sending = false,
      dirty = false,
      dead = false,
      complete = false,
      blocked = false,
      wantsSubmit = !!cached.submit;
    let enabled = !session.isLive || !!document.fullscreenElement;
    let epoch = Date.parse(session.serverNow),
      local = performance.now();
    const deadline = Date.parse(session.deadline!);
    const episode = new FocusEpisode();
    const estimated = () => Math.min(2, serverWarnings + events.length);
    const persist = () => {
      try {
        localStorage.setItem(
          key,
          JSON.stringify({ answers: drafts, events, submit: wantsSubmit }),
        );
      } catch {
        /* Autosave still works if local persistence is unavailable. */
      }
    };
    const pending = () =>
      Object.entries(drafts).some(([id, v]) => v.revision > (ack[id] ?? 0));
    const body = () => ({
      action: wantsSubmit ? "submit" : "sync",
      payload: {
        attemptId: session.attemptId,
        writeToken: session.writeToken,
        answers: drafts,
        events,
      },
    });
    const seconds = () =>
      Math.max(
        0,
        Math.ceil((deadline - (epoch + performance.now() - local)) / 1000),
      );
    const settle = (result: ExamSync) => {
      complete = true;
      enabled = false;
      setFinished(true);
      setStopped(true);
      setError("");
      setMessage(
        result.reason === "focus_limit"
          ? "দুইবার পরীক্ষা ছাড়ায় উত্তর স্বয়ংক্রিয়ভাবে জমা হয়েছে।"
          : result.reason === "deadline"
            ? "সময় শেষ। সংরক্ষিত উত্তর দিয়ে পরীক্ষা জমা হয়েছে।"
            : "পরীক্ষা জমা হয়েছে।",
      );
      try {
        localStorage.removeItem(key);
      } catch {}
      if (document.fullscreenElement)
        void document.exitFullscreen().catch(() => {});
    };
    async function flush() {
      if (dead || complete || blocked) return;
      if (sending) {
        dirty = true;
        return;
      }
      sending = true;
      dirty = false;
      const snapshot = body(),
        sentEvents = new Set(events.map((e) => e.id));
      try {
        const response = await fetch("/api/exam", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(snapshot),
          signal: AbortSignal.timeout(12000),
        });
        const result = await response.json();
        if (!response.ok) {
          if (
            response.status === 401 ||
            String(result.error).includes("অন্য tab/device")
          ) {
            blocked = true;
            setStopped(true);
          }
          throw Error(result.error || "উত্তর save হয়নি।");
        }
        if (dead) return;
        epoch = Date.parse(result.serverNow);
        local = performance.now();
        serverWarnings = result.warnings;
        ack = result.revisions;
        if (session.isLive && result.answers) {
          for (const [id, index] of Object.entries(
            result.answers as Record<string, number>,
          ))
            drafts[id] = { index, revision: ack[id] ?? 1 };
          setAnswers(
            Object.fromEntries(
              Object.entries(drafts).map(([id, value]) => [id, value.index]),
            ),
          );
        }
        events = events.filter((e) => !sentEvents.has(e.id));
        setWarnings(estimated());
        setError("");
        persist();
        if (result.status !== "in_progress") {
          settle(result);
          return;
        }
        setStopped(wantsSubmit || estimated() >= 2 || seconds() === 0);
        setMessage(pending() ? "উত্তর সংরক্ষণ হচ্ছে…" : "সব উত্তর সংরক্ষিত ✓");
      } catch (e) {
        if (!dead) {
          setError(e instanceof Error ? e.message : "সংযোগ নেই।");
          setMessage(
            "সংযোগ ফিরলে আবার save হবে। শুধু server-এ পৌঁছানো উত্তর নিশ্চিতভাবে সংরক্ষিত।",
          );
        }
      } finally {
        sending = false;
        if (dirty && !dead && !blocked && !complete)
          queueMicrotask(() => void flush());
      }
    }
    function beacon() {
      if (complete || blocked) return;
      persist();
      const text = JSON.stringify(body());
      // Sending is best-effort. The server deadline and scheduled job remain authoritative.
      if (new TextEncoder().encode(text).length < 60000)
        navigator.sendBeacon(
          "/api/exam",
          new Blob([text], { type: "application/json" }),
        );
    }
    function leave(kind: FocusEvent["kind"]) {
      if (
        !session.isLive ||
        !enabled ||
        complete ||
        blocked ||
        !episode.leave()
      )
        return;
      if (estimated() < 2) events.push({ id: crypto.randomUUID(), kind });
      setWarnings(estimated());
      setWarning(true);
      persist();
      if (estimated() >= 2) {
        setStopped(true);
        setMessage("দ্বিতীয়বার পরীক্ষা ছেড়েছেন। উত্তর জমা হচ্ছে…");
      }
      beacon();
      void flush();
    }
    function visibility() {
      if (document.visibilityState === "hidden") leave("hidden");
      else {
        if (document.hasFocus() && document.fullscreenElement)
          episode.returnToExam();
        void flush();
      }
    }
    function focus() {
      if (document.visibilityState === "visible" && document.fullscreenElement)
        episode.returnToExam();
      void flush();
    }
    function fullscreen() {
      if (!document.fullscreenElement) leave("fullscreen_exit");
    }
    function blur() {
      leave("blur");
    }
    function pagehide() {
      leave("pagehide");
      beacon();
    }
    function beforeunload(e: BeforeUnloadEvent) {
      if (!complete) {
        e.preventDefault();
        e.returnValue = "";
      }
    }
    operations.current = {
      choose: (id, index) => {
        if (
          (session.isLive && Object.hasOwn(drafts, id)) ||
          complete ||
          blocked ||
          wantsSubmit ||
          estimated() >= 2 ||
          seconds() === 0 ||
          !enabled
        )
          return;
        drafts = {
          ...drafts,
          [id]: {
            index,
            revision: Math.max(drafts[id]?.revision ?? 0, ack[id] ?? 0) + 1,
          },
        };
        setAnswers(
          Object.fromEntries(
            Object.entries(drafts).map(([k, v]) => [k, v.index]),
          ),
        );
        setMessage("উত্তর সংরক্ষণ হচ্ছে…");
        persist();
        void flush();
      },
      submit: () => {
        wantsSubmit = true;
        setStopped(true);
        setMessage("উত্তর জমা হচ্ছে…");
        persist();
        void flush();
      },
      resume: async () => {
        try {
          if (session.isLive && !document.fullscreenElement) {
            if (!document.documentElement.requestFullscreen)
              throw Error(
                "এই browser-এ Fullscreen নেই। সমর্থিত Chrome/Edge/Firefox browser ব্যবহার করুন।",
              );
            await document.documentElement.requestFullscreen();
          }
          enabled = true;
          episode.returnToExam();
          setArmed(true);
          setWarning(false);
          setError("");
          void flush();
        } catch {
          setError(
            "Fullscreen চালু হয়নি। বাটনে আবার চাপুন অথবা সমর্থিত browser ব্যবহার করুন।",
          );
        }
      },
    };
    // Restore offline drafts before showing the first editable frame.
    queueMicrotask(() => {
      if (dead) return;
      setAnswers(
        Object.fromEntries(
          Object.entries(drafts).map(([k, v]) => [k, v.index]),
        ),
      );
      setWarnings(estimated());
      setRemaining(seconds());
      if (events.length) setWarning(true);
      if (wantsSubmit || estimated() >= 2) setStopped(true);
      void flush();
    });
    const timer = setInterval(() => {
      if (dead || complete) return;
      setRemaining(seconds());
      if (seconds() === 0) {
        setStopped(true);
        void flush();
      }
    }, 1000);
    const heartbeat = setInterval(() => void flush(), 5000);
    document.addEventListener("visibilitychange", visibility);
    document.addEventListener("fullscreenchange", fullscreen);
    window.addEventListener("blur", blur);
    window.addEventListener("focus", focus);
    window.addEventListener("pagehide", pagehide);
    window.addEventListener("popstate", pagehide);
    window.addEventListener("beforeunload", beforeunload);
    window.addEventListener("online", focus);
    return () => {
      dead = true;
      clearInterval(timer);
      clearInterval(heartbeat);
      document.removeEventListener("visibilitychange", visibility);
      document.removeEventListener("fullscreenchange", fullscreen);
      window.removeEventListener("blur", blur);
      window.removeEventListener("focus", focus);
      window.removeEventListener("pagehide", pagehide);
      window.removeEventListener("popstate", pagehide);
      window.removeEventListener("beforeunload", beforeunload);
      window.removeEventListener("online", focus);
    };
  }, [session]);
  return {
    answers,
    remaining,
    message,
    error,
    warnings,
    warning,
    armed,
    stopped,
    finished,
    choose: (id: string, index: number) => operations.current.choose(id, index),
    submit: () => operations.current.submit(),
    resume: () => operations.current.resume(),
    done: () => doneRef.current(),
  };
}
