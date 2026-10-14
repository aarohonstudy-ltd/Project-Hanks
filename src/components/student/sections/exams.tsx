"use client";
import ExamCard from "@/components/student/cards/exam-card";
import { useDashboard } from "@/components/student/dashboard-context";
export default function ExamsSection({
  kind,
}: {
  kind: "live" | "free" | "upcoming";
}) {
  const { data, isEnded } = useDashboard();
  // Live exams disappear as soon as their time is over.
  const exams = data.exams.filter(
    (e) => e.kind === kind && !(kind === "live" && isEnded(e)),
  );

  return (
    <>
      <div className="sd-info">
        নির্ধারিত সময়ের মধ্যে উত্তর জমা দিন। নম্বর ও নেগেটিভ মার্কিং পরীক্ষার
        নিয়ম অনুযায়ী সার্ভারে হিসাব হবে।
      </div>
      <div className="sd-card-grid">
        {exams.map((e) => (
          <ExamCard key={e.id} e={e} />
        ))}
      </div>
      {kind === "live" && exams.length === 0 && (
        <p className="sd-empty">
          এই মুহূর্তে কোনো লাইভ পরীক্ষা চলছে না। নতুন পরীক্ষা শুরু হলে এখানে
          দেখা যাবে।
        </p>
      )}
    </>
  );
}
