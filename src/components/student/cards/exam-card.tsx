"use client";
import { useDashboard } from "@/components/student/dashboard-context";
import { bn } from "@/components/student/navigation";
import { Button } from "@/components/ui/button";
import type { Exam } from "@/lib/student/types";
import { ArrowRight, ClipboardCheck, Clock3, Zap } from "lucide-react";

export default function ExamCard({ e }: { e: Exam }) {
  const { saved, ready, run, start } = useDashboard();

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
      {e.kind === "upcoming" ? (
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
          {saved.reminders.includes(e.id) ? "রিমাইন্ডার সরান" : "মনে করিয়ে দিন"}
        </Button>
      ) : (
        <Button disabled={!ready || e.closed} onClick={() => start(e)}>
          {e.closed ? "পরীক্ষা শেষ" : "পরীক্ষা শুরু করুন"} <ArrowRight />
        </Button>
      )}
    </article>
  );
}
