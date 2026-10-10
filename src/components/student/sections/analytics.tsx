"use client";
import { useDashboard } from "@/components/student/dashboard-context";
import { bn } from "@/components/student/navigation";
import { ChevronRight } from "lucide-react";
export default function AnalyticsSection() {
  const { data, setReview, attempts, total, correct, accuracy } =
    useDashboard();

  return (
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
                (id) => data.questions.find((q) => q.id === id)?.subject === s,
              )
              .map(
                (id) =>
                  a.answers[id] ===
                  data.questions.find((q) => q.id === id)?.answer,
              ),
          );
          const rate = responses.length
            ? Math.round(
                (responses.filter(Boolean).length / responses.length) * 100,
              )
            : 0;
          return (
            <div className="sd-bar-row" key={s}>
              <div>
                <span>{s}</span>
                <strong>
                  {bn(rate)}% <small>({bn(responses.length)}টি প্রশ্ন)</small>
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
  );
}
