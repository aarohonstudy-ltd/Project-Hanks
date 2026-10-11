"use client";
import { useDashboard } from "@/components/student/dashboard-context";
import { bn } from "@/components/student/navigation";
import { Button } from "@/components/ui/button";
import type { Course } from "@/lib/student/types";
import { ArrowRight, GraduationCap } from "lucide-react";

export default function CourseCard({ c }: { c: Course }) {
  const { saved, ready, setNotice, setCourse, setLesson, update } =
    useDashboard();

  const count = saved.completed[c.id] ?? c.completed;
  const isEnrolled = c.enrolled || saved.enrolled.includes(c.id);
  return (
    <article className="sd-panel sd-course-card" key={c.id}>
      <div className={`sd-course-art ${c.color}`}>
        <span>{c.category}</span>
        <GraduationCap size={58} strokeWidth={1.1} />
        <small>আরোহণ / LEARN EVERY DAY</small>
      </div>
      <div className="sd-course-body">
        <h3>{c.title}</h3>
        <p>{c.description}</p>
        <div className="sd-progress-label">
          <span>{bn(c.lessons.length)}টি নমুনা লেসন</span>
          <strong>{bn(Math.round((count / c.lessons.length) * 100))}%</strong>
        </div>
        <progress
          max={c.lessons.length}
          value={count}
          aria-label={`${c.title} অগ্রগতি`}
        />
        <Button
          variant={isEnrolled ? "outline" : "default"}
          disabled={!ready}
          onClick={() => {
            if (!isEnrolled) {
              update({ ...saved, enrolled: [...saved.enrolled, c.id] });
              setNotice("ডেমো কোর্সে এনরোল করা হয়েছে।");
            }
            setLesson(Math.min(count, c.lessons.length - 1));
            setCourse(c);
          }}
        >
          {isEnrolled ? "পড়া চালিয়ে যান" : "ডেমো এনরোল করুন"} <ArrowRight />
        </Button>
      </div>
    </article>
  );
}
