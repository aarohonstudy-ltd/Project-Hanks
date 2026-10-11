"use client";
import type {
  Attempt,
  Course,
  Exam,
  Section,
  StudentData,
} from "@/lib/student/types";
import { useSelectedLayoutSegment } from "next/navigation";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { navigation } from "./navigation";
const STORE = "aarohon-student-demo-v1";
type Saved = {
  attempts: Attempt[];
  bookmarks: string[];
  enrolled: string[];
  completed: Record<string, number>;
  profile: StudentData["profile"];
  reminders: string[];
};

function useDashboardState(data: StudentData) {
  const segment = useSelectedLayoutSegment();
  const section = (segment ?? "overview") as Section;
  const [mobileOpen, setMobileOpen] = useState(false);
  const [previousSection, setPreviousSection] = useState(section);
  const [saved, setSaved] = useState<Saved>({
    attempts: [],
    bookmarks: ["q2"],
    enrolled: [],
    completed: {},
    profile: data.profile,
    reminders: [],
  });
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState("সব বিষয়");
  const [notifications, setNotifications] = useState(false);
  const [exam, setExam] = useState<Exam | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [review, setReview] = useState<Attempt | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [lesson, setLesson] = useState(0);
  const [revealed, setRevealed] = useState<string[]>([]);

  // Reset transient views on route changes without remounting sidebar/header or
  // reloading saved demo state. This also handles browser back/forward navigation.
  if (previousSection !== section) {
    setPreviousSection(section);
    setMobileOpen(false);
    setExam(null);
    setReview(null);
    setCourse(null);
    setNotifications(false);
    setNotice("");
    setQuery("");
    setSubject("সব বিষয়");
    setRevealed([]);
  }

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE);
      if (raw) {
        const value = JSON.parse(raw) as Saved;
        if (
          Array.isArray(value.attempts) &&
          Array.isArray(value.bookmarks) &&
          Array.isArray(value.enrolled) &&
          Array.isArray(value.reminders) &&
          value.completed &&
          typeof value.profile?.name === "string"
        ) {
          // Hydrate browser-only demo state after the server render.
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setSaved(value);
        }
      }
    } catch {
      /* Keep usable demo defaults if storage is unavailable. */
    }
    setReady(true);
  }, []);
  function update(next: Saved) {
    setSaved(next);
    try {
      localStorage.setItem(STORE, JSON.stringify(next));
    } catch {
      setNotice(
        "এই ব্রাউজারে তথ্য সংরক্ষণ করা যায়নি। পেজ বদলালে পরিবর্তন হারাতে পারে।",
      );
    }
  }
  function bookmark(id: string) {
    update({
      ...saved,
      bookmarks: saved.bookmarks.includes(id)
        ? saved.bookmarks.filter((x) => x !== id)
        : [...saved.bookmarks, id],
    });
  }
  const attempts = [...data.attempts, ...saved.attempts];
  const total = attempts.reduce((s, a) => s + a.total, 0);
  const correct = attempts.reduce((s, a) => s + a.score, 0);
  const accuracy = total ? Math.round((correct / total) * 100) : 0;
  const enrolled = data.courses.filter(
    (c) => c.enrolled || saved.enrolled.includes(c.id),
  );
  const wrongIds = Array.from(
    new Set(
      attempts.flatMap((a) =>
        a.questionIds.filter(
          (id) =>
            a.answers[id] !== data.questions.find((q) => q.id === id)?.answer,
        ),
      ),
    ),
  );
  const title =
    navigation.find((n) => n.id === section)?.label ||
    (
      { profile: "আমার প্রোফাইল", leaderboard: "লিডারবোর্ড" } as Record<
        string,
        string
      >
    )[section];
  function start(e: Exam) {
    setAnswers({});
    setReview(null);
    setExam(e);
  }
  function submit() {
    if (!exam) return;
    const score = exam.questions.filter(
      (id) => answers[id] === data.questions.find((q) => q.id === id)?.answer,
    ).length;
    const result: Attempt = {
      id: crypto.randomUUID(),
      examId: exam.id,
      title: exam.title,
      answers: { ...answers },
      questionIds: exam.questions,
      score,
      total: exam.questions.length,
      date: new Date().toLocaleDateString("bn-BD"),
    };
    update({ ...saved, attempts: [...saved.attempts, result] });
    setExam(null);
    setReview(result);
    setNotice("পরীক্ষা সম্পন্ন! ফলাফল ও ব্যাখ্যা দেখুন।");
  }

  return {
    data,
    segment,
    section,
    mobileOpen,
    setMobileOpen,
    previousSection,
    setPreviousSection,
    saved,
    setSaved,
    ready,
    setReady,
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
    answers,
    setAnswers,
    review,
    setReview,
    course,
    setCourse,
    lesson,
    setLesson,
    revealed,
    setRevealed,
    update,
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
type DashboardState = ReturnType<typeof useDashboardState>;
const DashboardContext = createContext<DashboardState | null>(null);
export function DashboardProvider({
  data,
  children,
}: {
  data: StudentData;
  children: ReactNode;
}) {
  const value = useDashboardState(data);
  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}
export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) throw new Error("useDashboard requires DashboardProvider");
  return context;
}
