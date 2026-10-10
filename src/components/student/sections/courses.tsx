"use client";
import CourseCard from "@/components/student/cards/course-card";
import { useDashboard } from "@/components/student/dashboard-context";
export default function CoursesSection() {
  const { data } = useDashboard();

  return (
    <>
      <div className="sd-info">
        নমুনা লেসন ও ডেমো এনরোলমেন্ট। আপনার অগ্রগতি এই ব্রাউজারেই সংরক্ষিত
        থাকবে।
      </div>
      <div className="sd-course-grid">
        {data.courses.map((c) => (
          <CourseCard key={c.id} c={c} />
        ))}
      </div>
    </>
  );
}
