"use client";
import type {
  Attempt,
  Course,
  Exam,
  Section,
  StudentData,
} from "@/lib/student/types";
import {
  studentAction,
  type Session,
  type ActionResult,
} from "@/lib/student/actions";
import { useSelectedLayoutSegment } from "next/navigation";
import {
  createContext,
  useContext,
  useState,
  useRef,
  type ReactNode,
} from "react";
import { navigation } from "./navigation";
function useDashboardState(initial: StudentData) {
  const [data, setData] = useState(initial);
  const segment = useSelectedLayoutSegment();
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
    [course, setCourse] = useState<Course | null>(null),
    [lesson, setLesson] = useState(0),
    [lessonData, setLessonData] = useState<ActionResult["lesson"]>(),
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
      if (r.data) setData(r.data);
      if (r.message) setNotice(r.message);
      return r;
    } finally {
      setBusy(false);
      lock.current = false;
    }
  }
  const attempts = data.attempts,
    total = attempts.reduce((s, a) => s + a.total, 0),
    correct = attempts.reduce((s, a) => s + a.score, 0),
    accuracy = total ? Math.round((correct / total) * 100) : 0,
    enrolled = data.courses.filter((c) => c.enrolled);
  const wrongIds = Array.from(
    new Set(
      attempts.flatMap((a) =>
        a.questionIds.filter((id) => {
          const q = data.questions.find((q) => q.id === id);
          return q && a.answers[id] !== q.answer;
        }),
      ),
    ),
  );
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
  async function start(e: Exam) {
    const r = await run(e.id === "practice" ? "start_practice" : "start", {
      id: e.id,
      questions: e.questions,
    });
    if (r?.session) {
      setSession(r.session);
      setAnswers({});
      setReview(null);
      setExam(e);
    }
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
        r.data?.attempts.find((a) => a.id === session.attemptId) ?? null,
      );
    }
  }
  async function openLesson(c: Course, i: number) {
    const id = c.lessonIds?.[i];
    if (!id) {
      setNotice("এখনো কোনো পাঠ প্রকাশিত হয়নি।");
      return;
    }
    const r = await run("lesson", { id });
    if (r?.lesson) {
      setCourse(c);
      setLesson(i);
      setLessonData(r.lesson);
    }
  }
  async function openCourse(c: Course) {
    if (!c.enrolled) {
      const r = await run("enroll", { id: c.id });
      if (!r) return;
      const fresh = r.data?.courses.find((x) => x.id === c.id);
      if (!fresh?.enrolled) return;
      c = fresh;
    }
    await openLesson(c, 0);
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
    course,
    setCourse,
    lesson,
    setLesson,
    lessonData,
    openLesson,
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
    wrongIds,
    title,
    start,
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
