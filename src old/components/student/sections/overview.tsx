"use client";
import CourseCard from "@/components/student/cards/course-card";
import { useDashboard } from "@/components/student/dashboard-context";
import { bn } from "@/components/student/navigation";
import {
  ArrowRight,
  BookOpen,
  Bookmark,
  ChevronRight,
  ClipboardCheck,
  GraduationCap,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";
import Link from "next/link";
export default function OverviewSection() {
  const { saved, setReview, attempts, total, accuracy, enrolled } =
    useDashboard();

  return (
    <>
      <section className="sd-welcome">
        <div>
          <span className="sd-welcome-tag">
            <Sparkles size={14} /> আপনার শেখার যাত্রা
          </span>
          <h2>স্বাগতম, {saved.profile.name}!</h2>
          <p>
            নিয়মিত অনুশীলনেই আত্মবিশ্বাস। আজ একটি মডেল টেস্ট দিয়ে শুরু করুন।
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
      <div className="sd-course-grid">
        {enrolled.map((c) => (
          <CourseCard key={c.id} c={c} />
        ))}
      </div>
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
  );
}
