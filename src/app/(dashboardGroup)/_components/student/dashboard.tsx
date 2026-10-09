"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import {
  ArrowRight,
  BarChart3,
  Bell,
  BookOpen,
  Bookmark,
  CalendarDays,
  Check,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  Gift,
  GraduationCap,
  Home,
  Layers3,
  LayoutDashboard,
  ListChecks,
  Menu,
  Moon,
  Play,
  Search,
  Sparkles,
  Sun,
  Target,
  Trophy,
  UserRound,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type {
  Attempt,
  Course,
  Exam,
  Question,
  Section,
  StudentData,
} from "@/lib/student/types";

const navigation = [
  { id: "overview", label: "ওভারভিউ", icon: LayoutDashboard },
  { id: "live", label: "লাইভ এক্সাম", icon: Zap },
  { id: "free", label: "ফ্রি মডেল টেস্ট", icon: Sparkles },
  { id: "upcoming", label: "আসন্ন পরীক্ষা", icon: CalendarDays },
  { id: "mistakes", label: "ভুল উত্তরের খাতা", icon: ListChecks },
  { id: "bookmarks", label: "বুকমার্ক", icon: Bookmark },
  { id: "analytics", label: "অ্যানালাইসিস", icon: BarChart3 },
  { id: "practice", label: "প্র্যাকটিস", icon: Target },
  { id: "questions", label: "প্রশ্ন ব্যাংক", icon: Layers3 },
  { id: "courses", label: "আমার কোর্স", icon: BookOpen },
  { id: "referral", label: "রেফারেল", icon: Gift },
] as const;
const href = (id: string) =>
  id === "overview" ? "/dashboard" : `/dashboard/${id}`;
const bn = (n: number) => n.toLocaleString("bn-BD");
const STORE = "aarohon-student-demo-v1";
type Saved = {
  attempts: Attempt[];
  bookmarks: string[];
  enrolled: string[];
  completed: Record<string, number>;
  profile: StudentData["profile"];
  reminders: string[];
};

export default function StudentDashboard({
  data,
  section,
}: {
  data: StudentData;
  section: Section;
}) {
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
  const { setTheme } = useTheme();
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
  function sidebar() {
    return (
      <div className="sd-sidebar-inner">
        <Link href="/" className="sd-brand">
          <span className="sd-logo">
            <GraduationCap size={25} />
          </span>
          <span>
            <strong>আরোহণ</strong>
            <small>STUDENT PORTAL</small>
          </span>
        </Link>
        <div className="sd-nav-label">শেখার ঠিকানা</div>
        <nav aria-label="শিক্ষার্থী মেনু">
          {navigation.map((n, i) => (
            <div key={n.id}>
              {i === 7 && (
                <div className="sd-nav-label sd-nav-divider">
                  অনুশীলন ও কোর্স
                </div>
              )}
              <Link
                href={href(n.id)}
                aria-current={section === n.id ? "page" : undefined}
                className={`sd-nav-link ${section === n.id ? "is-active" : ""}`}
              >
                <n.icon size={18} />
                <span>{n.label}</span>
                {n.id === "live" ? (
                  <span className="sd-dot" />
                ) : n.id === "courses" ? (
                  <small>{bn(enrolled.length)}</small>
                ) : null}
              </Link>
            </div>
          ))}
        </nav>
        <div className="sd-sidebar-bottom">
          <div className="sd-help">
            <Sparkles size={18} />
            <strong>ছোট ছোট চেষ্টায় বড় সাফল্য</strong>
            <p>আজকের অনুশীলনটি শেষ করেছেন?</p>
            <Link href="/dashboard/practice">
              অনুশীলন শুরু করুন <ArrowRight size={14} />
            </Link>
          </div>
          <Link href="/dashboard/profile" className="sd-account">
            <span className="sd-avatar">
              <UserRound size={20} />
            </span>
            <span>
              <strong>{saved.profile.name}</strong>
              <small>{saved.profile.id}</small>
            </span>
            <ChevronRight size={16} />
          </Link>
          <Link href="/" className="sd-home-link">
            <Home size={15} /> মূল ওয়েবসাইট
          </Link>
        </div>
      </div>
    );
  }
  function examCard(e: Exam) {
    return (
      <article className="sd-panel sd-exam-card" key={e.id}>
        <div className="sd-card-top">
          <span className={`sd-icon ${e.kind === "live" ? "rose" : "cyan"}`}>
            {e.kind === "live" ? <Zap /> : <ClipboardCheck />}
          </span>
          <span className="sd-chip">
            {e.kind === "upcoming"
              ? "আসন্ন"
              : e.kind === "live"
                ? "ডেমো লাইভ"
                : "ফ্রি"}
          </span>
        </div>
        <h3>{e.title}</h3>
        <p>
          {e.subject} · {bn(e.questions.length)}টি প্রশ্ন
        </p>
        <div className="sd-meta">
          <Clock3 size={14} />
          {e.date}
        </div>
        {e.kind === "upcoming" ? (
          <Button
            variant="outline"
            disabled={!ready}
            onClick={() => {
              const exists = saved.reminders.includes(e.id);
              update({
                ...saved,
                reminders: exists
                  ? saved.reminders.filter((x) => x !== e.id)
                  : [...saved.reminders, e.id],
              });
              setNotice(
                exists
                  ? "রিমাইন্ডার সরানো হয়েছে।"
                  : "ডেমো রিমাইন্ডার সংরক্ষিত। প্রকৃত নোটিফিকেশন পরে যুক্ত হবে।",
              );
            }}
          >
            {saved.reminders.includes(e.id)
              ? "রিমাইন্ডার সরান"
              : "মনে করিয়ে দিন"}
          </Button>
        ) : (
          <Button disabled={!ready} onClick={() => start(e)}>
            পরীক্ষা শুরু করুন <ArrowRight />
          </Button>
        )}
      </article>
    );
  }
  function courseCard(c: Course) {
    const count = saved.completed[c.id] ?? c.completed;
    const isEnrolled = c.enrolled || saved.enrolled.includes(c.id);
    return (
      <article className="sd-panel sd-course-card" key={c.id}>
        <div className={`sd-course-art ${c.color}`}>
          <span>{c.category}</span>
          <GraduationCap size={58} strokeWidth={1.1} />
          <small>আরোহণ / LEARN EVERY DAY</small>
        </div>
        <div className="sd-course-body">
          <h3>{c.title}</h3>
          <p>{c.description}</p>
          <div className="sd-progress-label">
            <span>{bn(c.lessons.length)}টি নমুনা লেসন</span>
            <strong>{bn(Math.round((count / c.lessons.length) * 100))}%</strong>
          </div>
          <progress
            max={c.lessons.length}
            value={count}
            aria-label={`${c.title} অগ্রগতি`}
          />
          <Button
            variant={isEnrolled ? "outline" : "default"}
            disabled={!ready}
            onClick={() => {
              if (!isEnrolled) {
                update({ ...saved, enrolled: [...saved.enrolled, c.id] });
                setNotice("ডেমো কোর্সে এনরোল করা হয়েছে।");
              }
              setLesson(Math.min(count, c.lessons.length - 1));
              setCourse(c);
            }}
          >
            {isEnrolled ? "পড়া চালিয়ে যান" : "ডেমো এনরোল করুন"} <ArrowRight />
          </Button>
        </div>
      </article>
    );
  }
  function questionCard(q: Question) {
    return (
      <article className="sd-panel sd-question" key={q.id}>
        <div className="sd-card-top">
          <span className="sd-chip">{q.subject}</span>
          <Button
            variant="ghost"
            size="icon"
            aria-label={
              saved.bookmarks.includes(q.id) ? "বুকমার্ক সরান" : "বুকমার্ক করুন"
            }
            aria-pressed={saved.bookmarks.includes(q.id)}
            disabled={!ready}
            onClick={() => bookmark(q.id)}
          >
            <Bookmark
              className={
                saved.bookmarks.includes(q.id)
                  ? "fill-current text-primary"
                  : ""
              }
            />
          </Button>
        </div>
        <h3>{q.text}</h3>
        <div className="sd-options-grid">
          {q.options.map((o, i) => (
            <div
              key={o}
              className={`sd-option ${revealed.includes(q.id) && i === q.answer ? "correct" : ""}`}
            >
              <span>{bn(i + 1)}</span>
              {o}
            </div>
          ))}
        </div>
        <Button
          variant="ghost"
          onClick={() =>
            setRevealed(
              revealed.includes(q.id)
                ? revealed.filter((x) => x !== q.id)
                : [...revealed, q.id],
            )
          }
        >
          {revealed.includes(q.id)
            ? "ব্যাখ্যা লুকান"
            : "উত্তর ও ব্যাখ্যা দেখুন"}
        </Button>
        {revealed.includes(q.id) && (
          <p className="sd-explanation">{q.explanation}</p>
        )}
      </article>
    );
  }
  const filteredQuestions = data.questions.filter(
    (q) =>
      (subject === "সব বিষয়" || q.subject === subject) &&
      q.text.toLowerCase().includes(query.toLowerCase()) &&
      (section !== "bookmarks" || saved.bookmarks.includes(q.id)) &&
      (section !== "mistakes" || wrongIds.includes(q.id)),
  );
  return (
    <div className="sd-app" lang="bn">
      <a className="sd-skip" href="#student-main">
        মূল কনটেন্টে যান
      </a>
      <aside className="sd-sidebar">{sidebar()}</aside>
      <div className="sd-workspace">
        <header className="sd-header">
          <div className="sd-header-left">
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="sd-mobile-menu"
                  aria-label="মেনু খুলুন"
                >
                  <Menu />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="sd-mobile-sheet">
                <SheetHeader className="sr-only">
                  <SheetTitle>স্টুডেন্ট মেনু</SheetTitle>
                  <SheetDescription>
                    ড্যাশবোর্ডের বিভাগ বেছে নিন
                  </SheetDescription>
                </SheetHeader>
                {sidebar()}
              </SheetContent>
            </Sheet>
            <div className="sd-breadcrumb">
              স্টুডেন্ট পোর্টাল <ChevronRight size={14} />
              <strong>{title}</strong>
            </div>
          </div>
          <div className="sd-header-actions">
            <span className="sd-demo-badge">DEMO</span>
            <Button
              variant="ghost"
              size="icon"
              aria-label="থিম পরিবর্তন করুন"
              onClick={() =>
                setTheme(
                  document.documentElement.classList.contains("dark")
                    ? "light"
                    : "dark",
                )
              }
            >
              <Sun className="hidden dark:block" />
              <Moon className="dark:hidden" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="নোটিফিকেশন"
              onClick={() => setNotifications(true)}
            >
              <Bell />
            </Button>
            <Link
              href="/dashboard/profile"
              className="sd-avatar"
              aria-label="আমার প্রোফাইল"
            >
              <UserRound size={19} />
            </Link>
          </div>
        </header>
        <main id="student-main" className="sd-main">
          <div className="sd-page-title">
            <div>
              <p className="sd-eyebrow">YOUR LEARNING SPACE</p>
              <h1>{section === "overview" ? "ড্যাশবোর্ড ওভারভিউ" : title}</h1>
              <p>প্রতিদিন একটু এগিয়ে, স্বপ্নের আরও কাছে।</p>
            </div>
            <Link href="/dashboard/leaderboard" className="sd-rank-link">
              <Trophy size={17} /> লিডারবোর্ড <ChevronRight size={15} />
            </Link>
          </div>
          {notice && (
            <div className="sd-notice" role="status">
              {notice}
              <button
                aria-label="বার্তা বন্ধ করুন"
                onClick={() => setNotice("")}
              >
                ×
              </button>
            </div>
          )}
          {section === "overview" && (
            <>
              <section className="sd-welcome">
                <div>
                  <span className="sd-welcome-tag">
                    <Sparkles size={14} /> আপনার শেখার যাত্রা
                  </span>
                  <h2>স্বাগতম, {saved.profile.name}!</h2>
                  <p>
                    নিয়মিত অনুশীলনেই আত্মবিশ্বাস। আজ একটি মডেল টেস্ট দিয়ে শুরু
                    করুন।
                  </p>
                  <Link href="/dashboard/free" className="sd-white-button">
                    আজকের অনুশীলন <ArrowRight size={16} />
                  </Link>
                </div>
                <div className="sd-welcome-visual" aria-hidden="true">
                  <div className="sd-orbit">
                    <GraduationCap size={78} strokeWidth={1.2} />
                  </div>
                  <span className="sd-float">LEARN. PRACTICE. GROW.</span>
                </div>
              </section>
              <section className="sd-stats" aria-label="প্রস্তুতির সারসংক্ষেপ">
                {[
                  {
                    icon: BookOpen,
                    label: "এনরোল করা কোর্স",
                    value: bn(enrolled.length),
                    detail: "আপনার শেখার পথ",
                    tone: "cyan",
                  },
                  {
                    icon: ClipboardCheck,
                    label: "সম্পন্ন পরীক্ষা",
                    value: bn(attempts.length),
                    detail: "নমুনা ফলাফলসহ",
                    tone: "violet",
                  },
                  {
                    icon: Target,
                    label: "সঠিক উত্তরের হার",
                    value: `${bn(accuracy)}%`,
                    detail: `${bn(total)}টি উত্তরের ভিত্তিতে`,
                    tone: "green",
                  },
                  {
                    icon: Bookmark,
                    label: "সংরক্ষিত প্রশ্ন",
                    value: bn(saved.bookmarks.length),
                    detail: "আবার পড়ার জন্য",
                    tone: "amber",
                  },
                ].map((s) => (
                  <article className="sd-panel sd-stat" key={s.label}>
                    <span className={`sd-icon ${s.tone}`}>
                      <s.icon size={20} />
                    </span>
                    <p>{s.label}</p>
                    <strong>{s.value}</strong>
                    <small>{s.detail}</small>
                  </article>
                ))}
              </section>
              <div className="sd-shortcuts">
                <Link href="/dashboard/live" className="sd-shortcut rose">
                  <span className="sd-icon rose">
                    <Zap />
                  </span>
                  <div>
                    <h3>লাইভ এক্সাম</h3>
                    <p>ডেমো পরীক্ষায় প্রস্তুতি যাচাই করুন</p>
                  </div>
                  <ArrowRight />
                </Link>
                <Link href="/dashboard/free" className="sd-shortcut green">
                  <span className="sd-icon green">
                    <Sparkles />
                  </span>
                  <div>
                    <h3>ফ্রি মডেল টেস্ট</h3>
                    <p>নিজের সুবিধামতো অনুশীলন করুন</p>
                  </div>
                  <ArrowRight />
                </Link>
              </div>
              <div className="sd-section-heading">
                <div>
                  <h2>আপনার চলমান কোর্স</h2>
                  <p>যেখান থেকে থেমেছিলেন, সেখান থেকেই শুরু করুন</p>
                </div>
                <Link href="/dashboard/courses">
                  সব কোর্স <ArrowRight size={15} />
                </Link>
              </div>
              <div className="sd-course-grid">{enrolled.map(courseCard)}</div>
              <div className="sd-section-heading">
                <div>
                  <h2>সাম্প্রতিক ফলাফল</h2>
                  <p>আপনার অনুশীলনের অগ্রগতি</p>
                </div>
                <Link href="/dashboard/analytics">
                  অ্যানালাইসিস <ArrowRight size={15} />
                </Link>
              </div>
              <div className="sd-panel sd-results">
                {[...attempts]
                  .reverse()
                  .slice(0, 4)
                  .map((a) => (
                    <button key={a.id} onClick={() => setReview(a)}>
                      <span className="sd-icon cyan">
                        <ClipboardCheck size={19} />
                      </span>
                      <span className="sd-result-name">
                        <strong>{a.title}</strong>
                        <small>{a.date}</small>
                      </span>
                      <span className="sd-result-score">
                        {bn(a.score)}
                        <small> / {bn(a.total)}</small>
                      </span>
                      <ChevronRight size={18} />
                    </button>
                  ))}
              </div>
            </>
          )}
          {(["live", "free", "upcoming"] as Section[]).includes(section) && (
            <>
              <div className="sd-info">
                সব পরীক্ষা নমুনা। এখানে কোনো বাস্তব লাইভ পরীক্ষা বা নির্ধারিত
                সময়সীমা নেই। প্রতিটি সঠিক উত্তরে ১ নম্বর, নেগেটিভ মার্কিং নেই।
              </div>
              <div className="sd-card-grid">
                {data.exams.filter((e) => e.kind === section).map(examCard)}
              </div>
            </>
          )}
          {section === "courses" && (
            <>
              <div className="sd-info">
                নমুনা লেসন ও ডেমো এনরোলমেন্ট। আপনার অগ্রগতি এই ব্রাউজারেই
                সংরক্ষিত থাকবে।
              </div>
              <div className="sd-course-grid">
                {data.courses.map(courseCard)}
              </div>
            </>
          )}
          {(
            ["questions", "bookmarks", "mistakes", "practice"] as Section[]
          ).includes(section) && (
            <>
              <div className="sd-filter">
                <div className="sd-search">
                  <Search size={18} />
                  <Input
                    aria-label="প্রশ্ন খুঁজুন"
                    placeholder="প্রশ্ন খুঁজুন…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
                <select
                  aria-label="বিষয় নির্বাচন"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                >
                  {[
                    "সব বিষয়",
                    ...new Set(data.questions.map((q) => q.subject)),
                  ].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
                {section === "practice" && (
                  <Button
                    disabled={!ready || !filteredQuestions.length}
                    onClick={() =>
                      start({
                        id: "practice",
                        title: `${subject} • প্র্যাকটিস`,
                        subject,
                        kind: "free",
                        date: "",
                        questions: filteredQuestions.map((q) => q.id),
                      })
                    }
                  >
                    প্র্যাকটিস শুরু করুন <Play />
                  </Button>
                )}
              </div>
              {section === "mistakes" && (
                <p className="sd-info">
                  নমুনা ও আপনার সম্পন্ন পরীক্ষার ভুল অথবা উত্তর না দেওয়া
                  প্রশ্নগুলো এখানে দেখানো হচ্ছে।
                </p>
              )}
              <div className="sd-question-list">
                {filteredQuestions.map(questionCard)}
              </div>
              {!filteredQuestions.length && (
                <div className="sd-empty">
                  <Bookmark />
                  <h2>কোনো প্রশ্ন পাওয়া যায়নি</h2>
                  <p>
                    সার্চ বা বিষয় পরিবর্তন করুন, অথবা প্রশ্ন ব্যাংক থেকে প্রশ্ন
                    সংরক্ষণ করুন।
                  </p>
                  <Link href="/dashboard/questions">প্রশ্ন ব্যাংকে যান →</Link>
                </div>
              )}
            </>
          )}
          {section === "analytics" && (
            <>
              <div className="sd-stats">
                {[
                  { label: "মোট পরীক্ষা", value: bn(attempts.length) },
                  { label: "সঠিক উত্তর", value: bn(correct) },
                  { label: "ভুল / অনুত্তরিত", value: bn(total - correct) },
                  { label: "সঠিক উত্তরের হার", value: `${bn(accuracy)}%` },
                ].map((s) => (
                  <div className="sd-panel sd-stat" key={s.label}>
                    <p>{s.label}</p>
                    <strong>{s.value}</strong>
                  </div>
                ))}
              </div>
              <section className="sd-panel sd-analytics">
                <h2>বিষয়ভিত্তিক প্রস্তুতি</h2>
                <p>নমুনা ও আপনার সম্পন্ন পরীক্ষার উত্তরের ভিত্তিতে</p>
                {[...new Set(data.questions.map((q) => q.subject))].map((s) => {
                  const responses = attempts.flatMap((a) =>
                    a.questionIds
                      .filter(
                        (id) =>
                          data.questions.find((q) => q.id === id)?.subject ===
                          s,
                      )
                      .map(
                        (id) =>
                          a.answers[id] ===
                          data.questions.find((q) => q.id === id)?.answer,
                      ),
                  );
                  const rate = responses.length
                    ? Math.round(
                        (responses.filter(Boolean).length / responses.length) *
                          100,
                      )
                    : 0;
                  return (
                    <div className="sd-bar-row" key={s}>
                      <div>
                        <span>{s}</span>
                        <strong>
                          {bn(rate)}%{" "}
                          <small>({bn(responses.length)}টি প্রশ্ন)</small>
                        </strong>
                      </div>
                      <progress value={rate} max={100} aria-label={s} />
                    </div>
                  );
                })}
              </section>
              <h2 className="sd-spaced-title">সব পরীক্ষার ফলাফল</h2>
              <div className="sd-panel sd-results">
                {[...attempts].reverse().map((a) => (
                  <button key={a.id} onClick={() => setReview(a)}>
                    <span className="sd-result-name">
                      <strong>{a.title}</strong>
                      <small>{a.date}</small>
                    </span>
                    <strong>
                      {bn(a.score)} / {bn(a.total)}
                    </strong>
                    <ChevronRight size={18} />
                  </button>
                ))}
              </div>
            </>
          )}
          {section === "profile" && (
            <form
              className="sd-panel sd-profile"
              onSubmit={(e) => {
                e.preventDefault();
                const form = new FormData(e.currentTarget);
                update({
                  ...saved,
                  profile: {
                    ...saved.profile,
                    name: String(form.get("name")).trim() || data.profile.name,
                    email: String(form.get("email")).trim(),
                    goal: String(form.get("goal")).trim(),
                  },
                });
                setNotice("ডেমো প্রোফাইল সংরক্ষিত হয়েছে।");
              }}
              key={ready ? "loaded" : "loading"}
            >
              <div className="sd-profile-heading">
                <span className="sd-avatar">
                  <UserRound />
                </span>
                <div>
                  <h2>আপনার পরিচিতি</h2>
                  <p>{saved.profile.id} · ডেমো অ্যাকাউন্ট</p>
                </div>
              </div>
              <Label htmlFor="student-name">নাম</Label>
              <Input
                id="student-name"
                name="name"
                maxLength={80}
                defaultValue={saved.profile.name}
                required
              />
              <Label htmlFor="student-email">ইমেইল</Label>
              <Input
                id="student-email"
                name="email"
                type="email"
                defaultValue={saved.profile.email}
                required
              />
              <Label htmlFor="student-goal">আপনার লক্ষ্য</Label>
              <Input
                id="student-goal"
                name="goal"
                maxLength={120}
                defaultValue={saved.profile.goal}
              />
              <p>
                তথ্য শুধু এই ব্রাউজারে থাকবে। এটি প্রকৃত লগইন বা Supabase
                অ্যাকাউন্ট নয়।
              </p>
              <Button disabled={!ready} type="submit">
                পরিবর্তন সংরক্ষণ করুন <Check />
              </Button>
            </form>
          )}
          {section === "referral" && (
            <section className="sd-panel sd-referral">
              <span className="sd-icon amber">
                <Gift />
              </span>
              <h2>একসাথে প্রস্তুতি, একসাথে এগিয়ে চলা</h2>
              <p>বন্ধুদের সঙ্গে আপনার ডেমো রেফারেল কোড শেয়ার করুন।</p>
              <div className="sd-referral-code">
                AAROHON-DEMO{" "}
                <Button
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText("AAROHON-DEMO");
                      setNotice("কোড কপি হয়েছে।");
                    } catch {
                      setNotice(
                        "কপি করা যায়নি। AAROHON-DEMO কোডটি নির্বাচন করে কপি করুন।",
                      );
                    }
                  }}
                >
                  কপি করুন
                </Button>
              </div>
              <div className="sd-info">
                এটি কেবল UI ডেমো। রেফারেল ট্র্যাকিং, পুরস্কার বা অর্থ লেনদেন এখন
                চালু নেই।
              </div>
            </section>
          )}
          {section === "leaderboard" && (
            <section className="sd-panel sd-leaderboard">
              <h2>প্রস্তুতির অনুপ্রেরণা</h2>
              <p>
                নিচের তালিকাটি সম্পূর্ণ নমুনা; এটি আপনার বাস্তব র‍্যাঙ্ক নয়।
              </p>
              {[
                { name: "শিক্ষার্থী এক", score: 98 },
                { name: "শিক্ষার্থী দুই", score: 94 },
                { name: "শিক্ষার্থী তিন", score: 90 },
              ].map((p, i) => (
                <div key={p.name}>
                  <span className="sd-icon amber">
                    <Trophy size={19} />
                  </span>
                  <strong>#{bn(i + 1)}</strong>
                  <span>{p.name}</span>
                  <b>{bn(p.score)} / ১০০</b>
                </div>
              ))}
            </section>
          )}
          <footer className="sd-footer">
            <span>© 2026 আরোহণ · শেখার পথে আপনার সঙ্গী</span>
            <span>ডেমো স্টুডেন্ট পোর্টাল</span>
          </footer>
        </main>
      </div>
      <Dialog open={notifications} onOpenChange={setNotifications}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>নোটিফিকেশন</DialogTitle>
            <DialogDescription>
              নমুনা আপডেট ও আপনার সংরক্ষিত রিমাইন্ডার
            </DialogDescription>
          </DialogHeader>
          {data.notifications.map((n) => (
            <div className="sd-notification" key={n.title}>
              <Bell size={18} />
              <div>
                <strong>{n.title}</strong>
                <p>{n.body}</p>
              </div>
            </div>
          ))}
          {saved.reminders.map((id) => (
            <p key={id}>
              রিমাইন্ডার: {data.exams.find((e) => e.id === id)?.title}
            </p>
          ))}
        </DialogContent>
      </Dialog>
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
              নমুনা পরীক্ষা · প্রতিটি প্রশ্নে ১ নম্বর · উত্তর দিয়ে জমা দিন। বন্ধ
              করলে অসম্পূর্ণ উত্তর সংরক্ষিত হবে না।
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            {exam?.questions.map((id, index) => {
              const q = data.questions.find((x) => x.id === id)!;
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
                        required
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
      <Dialog
        open={!!review}
        onOpenChange={(open) => {
          if (!open) setReview(null);
        }}
      >
        <DialogContent className="sd-dialog">
          <DialogHeader>
            <DialogTitle>পরীক্ষার ফলাফল</DialogTitle>
            <DialogDescription>
              {review?.title} · {review?.date}
            </DialogDescription>
          </DialogHeader>
          {review && (
            <>
              <div className="sd-score-banner">
                <Trophy />
                <strong>
                  {bn(review.score)} / {bn(review.total)}
                </strong>
                <span>সঠিক উত্তর</span>
              </div>
              {review.questionIds.map((id) => {
                const q = data.questions.find((x) => x.id === id)!;
                const ok = review.answers[id] === q.answer;
                return (
                  <div className="sd-review-question" key={id}>
                    <span className={`sd-chip ${ok ? "green" : "rose"}`}>
                      {ok ? "সঠিক" : "আবার পড়ুন"}
                    </span>
                    <h3>{q.text}</h3>
                    <p>
                      আপনার উত্তর:{" "}
                      {q.options[review.answers[id]] ?? "উত্তর দেওয়া হয়নি"}
                    </p>
                    <strong>সঠিক উত্তর: {q.options[q.answer]}</strong>
                    <p>{q.explanation}</p>
                    <Button
                      variant="outline"
                      disabled={!ready}
                      onClick={() => bookmark(id)}
                    >
                      <Bookmark />
                      {saved.bookmarks.includes(id)
                        ? "বুকমার্ক সরান"
                        : "বুকমার্ক করুন"}
                    </Button>
                  </div>
                );
              })}
            </>
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!course}
        onOpenChange={(open) => {
          if (!open) setCourse(null);
        }}
      >
        <DialogContent className="sd-dialog">
          <DialogHeader>
            <DialogTitle>{course?.title}</DialogTitle>
            <DialogDescription>
              নমুনা পাঠ · ভিডিও ও পূর্ণ কনটেন্ট পরে যুক্ত হবে
            </DialogDescription>
          </DialogHeader>
          {course && (
            <>
              <div className="sd-lesson-tabs">
                {course.lessons.map((name, i) => (
                  <button
                    key={name}
                    className={lesson === i ? "active" : ""}
                    onClick={() => setLesson(i)}
                  >
                    {i < (saved.completed[course.id] ?? course.completed)
                      ? "✓ "
                      : ""}
                    {bn(i + 1)}. {name}
                  </button>
                ))}
              </div>
              <article className="sd-lesson">
                <span className="sd-chip">পাঠ {bn(lesson + 1)}</span>
                <h2>{course.lessons[lesson]}</h2>
                <p>
                  এই পাঠটি আপনার প্রস্তুতির একটি ছোট অনুশীলন। বিষয়টি পড়ার সময়
                  মূল সংজ্ঞা ও গুরুত্বপূর্ণ তথ্য নিজের ভাষায় নোট করুন।
                </p>
                <ol>
                  <li>আজকের বিষয়ের জন্য ২০ মিনিট সময় নির্ধারণ করুন।</li>
                  <li>মূল ধারণাগুলো পড়ুন এবং তিনটি গুরুত্বপূর্ণ বিষয় লিখুন।</li>
                  <li>
                    প্রশ্ন ব্যাংক থেকে সংশ্লিষ্ট বিষয়ের প্রশ্ন অনুশীলন করুন।
                  </li>
                  <li>ভুল উত্তরের ব্যাখ্যা পড়ে আবার চেষ্টা করুন।</li>
                </ol>
                <p>
                  সম্পূর্ণ কোর্স কনটেন্ট ও ভিডিও পরবর্তী backend সংযোগের সময়
                  যুক্ত করা হবে।
                </p>
                <Button
                  disabled={
                    !ready ||
                    lesson > (saved.completed[course.id] ?? course.completed)
                  }
                  onClick={() => {
                    update({
                      ...saved,
                      completed: {
                        ...saved.completed,
                        [course.id]: Math.max(
                          saved.completed[course.id] ?? course.completed,
                          lesson + 1,
                        ),
                      },
                    });
                    if (lesson < course.lessons.length - 1)
                      setLesson(lesson + 1);
                    else setCourse(null);
                    setNotice("লেসনের অগ্রগতি সংরক্ষণ হয়েছে।");
                  }}
                >
                  <Check />
                  পাঠ সম্পন্ন করুন
                </Button>
                {lesson > (saved.completed[course.id] ?? course.completed) && (
                  <p>আগের পাঠগুলো আগে সম্পন্ন করুন।</p>
                )}
              </article>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
