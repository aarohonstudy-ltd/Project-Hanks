"use client";
import { examAccess } from "@/lib/student/exam-access";
import type {
  Attempt,
  Course,
  Exam,
  Section,
  StudentData,
} from "@/lib/student/types";
import { studentAction, type Session } from "@/lib/student/actions";
import { useRouter, useSelectedLayoutSegment } from "next/navigation";
import {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import { navigation } from "./navigation";
import { setCacheScope } from "@/lib/client-cache";
function useDashboardState(initial: StudentData) {
  // Cached reads belong to one user; a different account starts empty.
  setCacheScope(initial.profile.id);
  const [data, setData] = useState(initial);
  const segment = useSelectedLayoutSegment();
  const router = useRouter();
  const section = (segment ?? "overview") as Section;
  const [mobileOpen, setMobileOpen] = useState(false),
    [notice, setNotice] = useState(""),
    [query, setQuery] = useState(""),
    [subject, setSubject] = useState("সব বিষয়"),
    [notifications, setNotifications] = useState(false),
    [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [exam, setExam] = useState<Exam | null>(null),
    [session, setSession] = useState<Session | null>(null),
    [answers, setAnswers] = useState<Record<string, number>>({}),
    [review, setReview] = useState<Attempt | null>(null),
    [revealed, setRevealed] = useState<string[]>([]);
  const saved = {
    profile: data.profile,
    attempts: data.attempts,
    bookmarks: data.bookmarks ?? [],
    reminders: data.reminders ?? [],
    enrolled: data.courses.filter((c) => c.enrolled).map((c) => c.id),
    completed: Object.fromEntries(data.courses.map((c) => [c.id, c.completed])),
  };
  async function run(action: string, payload: Record<string, unknown> = {}) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    try {
      const r = await studentAction(action, payload);
      if (r.error) {
        setNotice(r.error);
        return;
      }
      if (r.data)
        setData({
          ...r.data,
          profile: { ...r.data.profile, role: data.profile.role },
        });
      if (r.patch) {
        const patch = r.patch;
        setData((previous) => ({
          ...previous,
          ...patch,
          profile: patch.profile
            ? { ...patch.profile, role: previous.profile.role }
            : previous.profile,
        }));
      }
      if (r.message) setNotice(r.message);
      return r;
    } finally {
      setBusy(false);
      lock.current = false;
    }
  }
  const attempts = data.attempts;
  const { total, correct, accuracy } = useMemo(() => {
    const total = attempts.reduce((sum, a) => sum + a.total, 0);
    const correct = attempts.reduce((sum, a) => sum + a.score, 0);
    return {
      total,
      correct,
      accuracy: total ? Math.round((correct / total) * 100) : 0,
    };
  }, [attempts]);
  const enrolled = data.courses.filter((c) => c.enrolled);
  // Live exams a student can join right now (ended ones are excluded).
  const liveOpen = data.exams.filter((e) => e.kind === "live" && !e.closed);
  const title =
    navigation.find((n) => n.id === section)?.label ??
    (
      { profile: "আমার প্রোফাইল", leaderboard: "লিডারবোর্ড" } as Record<
        string,
        string
      >
    )[section];
  async function bookmark(id: string) {
    await run("bookmark", { id, enabled: !saved.bookmarks.includes(id) });
  }
  const resumed = useRef(false);
  useEffect(() => {
    if (resumed.current) return;
    resumed.current = true;
    void studentAction("resume_exam").then((r) => {
      if (r.data)
        setData((previous) => ({
          ...r.data!,
          profile: { ...r.data!.profile, role: previous.profile.role },
        }));
      if (r.session) {
        setSession(r.session);
        setAnswers(r.session.answers ?? {});
        setExam({
          id: r.session.examId!,
          title: r.session.title!,
          kind: r.session.isLive ? "live" : "free",
          subject: "চলমান পরীক্ষা",
          date: "",
          questions: r.session.items.map((q) => q.id),
        });
      }
    });
  }, []);
  async function begin(e: Exam, consent = false) {
    if (
      e.id !== "practice" &&
      (e.completed ||
        data.exams.find((item) => item.id === e.id)?.completed ||
        data.attempts.some((attempt) => attempt.examId === e.id))
    ) {
      setNotice("এই পরীক্ষা দেওয়া হয়েছে।");
      return;
    }
    const access = examAccess(e, data.courses);
    if (e.id !== "practice" && access.locked) {
      setNotice(access.reason);
      return;
    }
    const r = await run(e.id === "practice" ? "start_practice" : "start", {
      id: e.id,
      questions: e.questions,
      consent,
    });
    if (r?.session) {
      setSession(r.session);
      setAnswers(r.session.answers ?? {});
      setReview(null);
      setExam(
        r.session.examId
          ? {
              ...e,
              id: r.session.examId,
              title: r.session.title ?? e.title,
              kind: r.session.isLive ? "live" : "free",
            }
          : e,
      );
    }
    return r?.session;
  }
  async function start(e: Exam) {
    if (
      e.id !== "practice" &&
      (e.completed ||
        data.exams.find((item) => item.id === e.id)?.completed ||
        data.attempts.some((attempt) => attempt.examId === e.id))
    ) {
      setNotice("এই পরীক্ষা দেওয়া হয়েছে।");
      return;
    }
    const access = examAccess(e, data.courses);
    if (e.id !== "practice" && access.locked) {
      setNotice(access.reason);
      return;
    }
    if (session && !session.practice) {
      setNotice("চলমান পরীক্ষাটি আগে জমা দিন।");
      return;
    }
    if (e.kind === "live") {
      setSession(null);
      setExam(e);
      setNotice("");
    } else await begin(e);
  }
  async function finishExam() {
    if (session?.examId && !session.practice) {
      const completedId = session.examId;
      setData((previous) => ({
        ...previous,
        exams: previous.exams.map((item) =>
          item.id === completedId ? { ...item, completed: true } : item,
        ),
      }));
    }
    setExam(null);
    setSession(null);
    setNotice("পরীক্ষা জমা হয়েছে। প্রকাশের সময় হলে ফলাফল দেখা যাবে।");
    await run("refresh_dashboard");
    router.push("/dashboard");
  }
  async function submit() {
    if (!session) return;
    const r = await run("submit", {
      attemptId: session.attemptId,
      practice: session.practice,
      answers,
    });
    if (r) {
      setExam(null);
      setSession(null);
      setReview(
        (r.patch?.attempts ?? r.data?.attempts)?.find(
          (a) => a.id === session.attemptId,
        ) ?? null,
      );
    }
  }
  async function openCourse(c: Course) {
    if (!c.enrolled) {
      const r = await run("enroll", { id: c.id });
      if (!r) return;
      const fresh = (r.patch?.courses ?? r.data?.courses)?.find(
        (x) => x.id === c.id,
      );
      if (!fresh?.enrolled) return;
      c = fresh;
    }
    router.push(`/dashboard/courses/${c.id}`);
  }
  return {
    data,
    segment,
    section,
    mobileOpen,
    setMobileOpen,
    saved,
    ready: !busy,
    busy,
    notice,
    setNotice,
    query,
    setQuery,
    subject,
    setSubject,
    notifications,
    setNotifications,
    exam,
    setExam,
    session,
    answers,
    setAnswers,
    review,
    setReview,
    openCourse,
    revealed,
    setRevealed,
    run,
    bookmark,
    attempts,
    total,
    correct,
    accuracy,
    enrolled,
    liveOpen,
    title,
    start,
    begin,
    finishExam,
    submit,
  };
}
type State = ReturnType<typeof useDashboardState>;
const Context = createContext<State | null>(null);
export function DashboardProvider({
  data,
  children,
}: {
  data: StudentData;
  children: ReactNode;
}) {
  const value = useDashboardState(data);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useDashboard() {
  const c = useContext(Context);
  if (!c) throw Error("DashboardProvider required");
  return c;
}
