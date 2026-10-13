"use client";
import Link from "next/link";
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

export default function ExamCard({ e }: { e: Exam }) {
  const { data, saved, ready, run, start } = useDashboard();

  const access = examAccess(e, data.courses);
  const reasonId = `exam-access-${e.id}`;
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
              ? "লাইভ"
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
      {access.locked && (
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
      {e.kind === "upcoming" ? (
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
          disabled={!ready || e.closed || access.locked}
          aria-describedby={access.locked ? reasonId : undefined}
          onClick={() => start(e)}
        >
          {e.closed ? "পরীক্ষা শেষ" : "পরীক্ষা শুরু করুন"} <ArrowRight />
        </Button>
      )}
    </article>
  );
}
