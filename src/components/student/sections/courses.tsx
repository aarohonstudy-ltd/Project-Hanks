"use client";
import { useSearchParams } from "next/navigation";
import CourseCard from "@/components/student/cards/course-card";
import { useDashboard } from "@/components/student/dashboard-context";
export default function CoursesSection() {
  const { data } = useDashboard();
  const selected = useSearchParams().get("course");
  const courses = [...data.courses].sort(
    (a, b) => Number(b.id === selected) - Number(a.id === selected),
  );

  return (
    <>
      <div className="sd-info">
        প্রকাশিত কোর্স ও পাঠ। আপনার অগ্রগতি অ্যাকাউন্টে সংরক্ষিত থাকবে।
      </div>
      <div className="sd-course-grid">
        {courses.map((c) => (
          <div
            key={c.id}
            className={
              c.id === selected
                ? "rounded-2xl ring-2 ring-primary ring-offset-2 ring-offset-background"
                : ""
            }
          >
            <CourseCard c={c} />
          </div>
        ))}
      </div>
    </>
  );
}
