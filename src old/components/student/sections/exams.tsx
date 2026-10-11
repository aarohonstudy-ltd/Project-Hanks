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
        সব পরীক্ষা নমুনা। এখানে কোনো বাস্তব লাইভ পরীক্ষা বা নির্ধারিত সময়সীমা
        নেই। প্রতিটি সঠিক উত্তরে ১ নম্বর, নেগেটিভ মার্কিং নেই।
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
