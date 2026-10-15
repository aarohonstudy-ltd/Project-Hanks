"use client";
import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import CourseCard from "@/components/student/cards/course-card";
import { useDashboard } from "@/components/student/dashboard-context";
import { bn } from "@/components/student/navigation";
export default function CoursesSection({
  catalog = false,
}: {
  catalog?: boolean;
}) {
  const { data } = useDashboard();
  const selected = useSearchParams().get("course");
  const [query, setQuery] = useState("");
  const courses = data.courses.filter((c) => catalog || c.enrolled);
  const visible = courses
    .filter((c) =>
      `${c.title} ${c.category}`.toLowerCase().includes(query.toLowerCase()),
    )
    .sort((a, b) => Number(b.id === selected) - Number(a.id === selected));
  return (
    <div className="space-y-6">
      <div className="sd-panel p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">
            {catalog ? "আপনার পরবর্তী কোর্স বেছে নিন" : "আপনার শেখার জায়গা"}
          </h2>
          <p className="mt-2 text-muted-foreground">
            {catalog
              ? "কোর্সে ভর্তি হয়ে লেসন, ভিডিও ও নোট পড়ুন।"
              : `${bn(courses.length)}টি enrolled কোর্স · অগ্রগতি অ্যাকাউন্টে সংরক্ষিত থাকবে।`}
          </p>
        </div>
        <Link
          className="text-primary font-medium"
          href={catalog ? "/dashboard/courses" : "/dashboard/catalog"}
        >
          {catalog ? "আমার কোর্স →" : "নতুন কোর্স খুঁজুন →"}
        </Link>
      </div>
      <input
        aria-label="কোর্স খুঁজুন"
        className="w-full rounded-xl border bg-background p-3"
        placeholder="কোর্সের নাম দিয়ে খুঁজুন…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {visible.length ? (
        <div className="sd-course-grid">
          {visible.map((c) => (
            <div
              key={c.id}
              className={
                c.id === selected ? "rounded-2xl ring-2 ring-primary" : ""
              }
            >
              <CourseCard c={c} />
            </div>
          ))}
        </div>
      ) : (
        <div className="sd-panel p-8 text-center">
          <h3 className="font-bold">
            {query ? "কোনো কোর্স পাওয়া যায়নি" : "এখনো কোনো কোর্স নেই"}
          </h3>
          <p className="mt-2 text-muted-foreground">
            {query
              ? "অন্য নাম দিয়ে খুঁজুন।"
              : "সকল কোর্স থেকে পছন্দের কোর্সে ভর্তি করুন। অনুমোদনের অপেক্ষায় থাকা কোর্স ভর্তি নিশ্চিত হলে এখানে দেখাবে।"}
          </p>
          <Link
            className="inline-block mt-4 text-primary"
            href="/dashboard/catalog"
          >
            সকল কোর্স দেখুন →
          </Link>
        </div>
      )}
    </div>
  );
}
