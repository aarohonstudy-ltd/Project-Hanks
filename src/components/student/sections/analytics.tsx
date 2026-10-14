"use client";
import { useEffect, useState } from "react";
import {
  loadSubjectStats,
  type SubjectStat,
} from "@/lib/student/question-actions";
import { useDashboard } from "@/components/student/dashboard-context";
import { readCache, writeCache } from "@/lib/client-cache";
import { bn } from "@/components/student/navigation";
import { ChevronRight } from "lucide-react";
export default function AnalyticsSection() {
  const { setReview, attempts, total, correct, accuracy } = useDashboard();

  // Revisits show the last stats at once while fresh ones load.
  const [stats, setStats] = useState<SubjectStat[] | undefined>(() =>
    readCache<SubjectStat[]>("subject-stats"),
  );
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    void loadSubjectStats()
      .then((r) => {
        if (r.data) writeCache("subject-stats", r.data);
        if (active) {
          setStats((previous) => r.data ?? previous);
          setError(r.error ?? "");
        }
      })
      .catch(() => {
        if (active) setError("সংযোগের সমস্যা। আবার চেষ্টা করুন।");
      });
    return () => {
      active = false;
    };
  }, [retry, attempts]);

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
        <p>আপনার সম্পন্ন পরীক্ষার উত্তরের ভিত্তিতে</p>
        {!stats && !error && <p role="status">পরিসংখ্যান লোড হচ্ছে…</p>}
        {error && (
          <p role="alert">
            {error}{" "}
            <button onClick={() => setRetry((v) => v + 1)}>আবার চেষ্টা</button>
          </p>
        )}
        {stats?.map(({ subject: s, total: count, correct: right }) => {
          const rate = count ? Math.round((right / count) * 100) : 0;
          return (
            <div className="sd-bar-row" key={s}>
              <div>
                <span>{s}</span>
                <strong>
                  {bn(rate)}% <small>({bn(count)}টি প্রশ্ন)</small>
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
