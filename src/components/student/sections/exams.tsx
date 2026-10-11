"use client";
import ExamCard from "@/components/student/cards/exam-card";
import { useDashboard } from "@/components/student/dashboard-context";
export default function ExamsSection({
  kind,
}: {
  kind: "live" | "free" | "upcoming";
}) {
  const { data } = useDashboard();

  return (
    <>
      <div className="sd-info">
        নির্ধারিত সময়ের মধ্যে উত্তর জমা দিন। নম্বর ও নেগেটিভ মার্কিং পরীক্ষার
        নিয়ম অনুযায়ী সার্ভারে হিসাব হবে।
      </div>
      <div className="sd-card-grid">
        {data.exams
          .filter((e) => e.kind === kind)
          .map((e) => (
            <ExamCard key={e.id} e={e} />
          ))}
      </div>
    </>
  );
}
