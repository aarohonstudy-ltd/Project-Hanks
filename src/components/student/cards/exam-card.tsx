"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { examAccess } from "@/lib/student/exam-access";
import { useDashboard } from "@/components/student/dashboard-context";
import { bn } from "@/components/student/navigation";
import { Button } from "@/components/ui/button";
import type { Exam } from "@/lib/student/types";
import {
  ArrowRight,
  ClipboardCheck,
  Clock3,
  Zap,
  LockKeyhole,
} from "lucide-react";

const bnDigits = (s: string) => s.replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[+d]);
// Time left until a live exam ends, ticking every second on the server clock.
function Countdown({ endsAt }: { endsAt: string }) {
  const { serverNow } = useDashboard();
  const [left, setLeft] = useState<number>();
  useEffect(() => {
    const tick = () => setLeft(Math.max(0, Date.parse(endsAt) - serverNow()));
    const first = setTimeout(tick, 0);
    const timer = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [endsAt, serverNow]);
  if (left === undefined) return null;
  const total = Math.floor(left / 1000);
  const days = Math.floor(total / 86400);
  const clock = [
    Math.floor((total % 86400) / 3600),
    Math.floor((total % 3600) / 60),
    total % 60,
  ]
    .map((n) => String(n).padStart(2, "0"))
    .join(":");
  return (
    <span className={`sd-countdown ${total < 600 ? "is-urgent" : ""}`}>
      <Clock3 size={14} /> শেষ হতে বাকি{" "}
      <b>
        {days > 0 ? `${bn(days)} দিন ` : ""}
        {bnDigits(clock)}
      </b>
    </span>
  );
}

export default function ExamCard({ e }: { e: Exam }) {
  const { data, saved, ready, run, start, isEnded } = useDashboard();
  const live = e.kind === "live";
  const ended = isEnded(e);

  const completed =
    !!e.completed || data.attempts.some((attempt) => attempt.examId === e.id);
  const access = examAccess(e, data.courses);
  const reasonId = `exam-access-${e.id}`;
  return (
    <article
      className={`sd-panel sd-exam-card ${live ? "is-live" : e.kind === "free" ? "is-free" : ""}`}
      key={e.id}
    >
      <div className="sd-card-top">
        <span
          className={`sd-icon ${live ? "rose" : e.kind === "free" ? "green" : "cyan"}`}
        >
          {live ? <Zap /> : <ClipboardCheck />}
        </span>
        <span className={live ? "sd-live-tag" : "sd-chip"}>
          {live && <i aria-hidden />}
          {e.kind === "upcoming"
            ? "আসন্ন"
            : live
              ? "LIVE"
              : e.isFree === false
                ? "কোর্স পরীক্ষা"
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
      {live && !ended && e.endsAt && <Countdown endsAt={e.endsAt} />}
      {!completed && access.locked && (
        <div className="sd-exam-access" id={reasonId}>
          <span className="sd-chip">
            <LockKeyhole size={14} />{" "}
            {access.course?.pending
              ? "অনুমোদন অপেক্ষমাণ"
              : "কোর্সে ভর্তি প্রয়োজন"}
          </span>
          <p>{access.reason}</p>
          {access.course && (
            <Link
              href={`/dashboard/catalog?course=${encodeURIComponent(access.course.id)}`}
            >
              {access.course.pending
                ? "কোর্স ও ভর্তির অবস্থা দেখুন"
                : "কোর্স দেখুন ও ভর্তি হন"}{" "}
              <ArrowRight size={14} />
            </Link>
          )}
          <Button
            size="sm"
            variant="ghost"
            disabled={!ready}
            onClick={() => run("refresh_dashboard")}
          >
            ভর্তির তথ্য আবার যাচাই করুন
          </Button>
        </div>
      )}
      {completed ? (
        <Button disabled>
          পরীক্ষা দেওয়া হয়েছে <ClipboardCheck />
        </Button>
      ) : e.kind === "upcoming" ? (
        <>
          {access.locked && (
            <Button disabled aria-describedby={reasonId}>
              পরীক্ষা শুরু করুন <LockKeyhole />
            </Button>
          )}

          <Button
            variant="outline"
            disabled={!ready}
            onClick={() =>
              run("reminder", {
                id: e.id,
                enabled: !saved.reminders.includes(e.id),
              })
            }
          >
            {saved.reminders.includes(e.id)
              ? "রিমাইন্ডার সরান"
              : "মনে করিয়ে দিন"}
          </Button>
        </>
      ) : (
        <Button
          className={
            ended ? undefined : live ? "sd-live-start" : "sd-free-start"
          }
          disabled={!ready || ended || access.locked}
          aria-describedby={access.locked ? reasonId : undefined}
          onClick={() => start(e)}
        >
          {ended ? "পরীক্ষা শেষ" : "পরীক্ষা শুরু করুন"} <ArrowRight />
        </Button>
      )}
    </article>
  );
}
