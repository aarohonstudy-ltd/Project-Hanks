"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  CheckCircle2,
  Download,
  FileText,
  PlayCircle,
} from "lucide-react";
import CourseCover from "@/components/course-cover";
import CourseVideo from "@/components/course-video";
import { Button } from "@/components/ui/button";
import { useDashboard } from "./dashboard-context";
import { bn } from "./navigation";
import type { CourseRoom } from "@/lib/student/course-types";
export default function Classroom({ room }: { room: CourseRoom }) {
  const { data, run, ready } = useDashboard();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const { course, lessons, lesson } = room;
  const done = (id: string) =>
    (data.completedLessonIds ?? []).includes(id) ||
    lessons.some((l) => l.id === id && l.completed);
  const completed = lessons.filter((l) => done(l.id)).length;
  const percent = lessons.length
    ? Math.round((completed / lessons.length) * 100)
    : 0;
  const index = lessons.findIndex((l) => l.id === lesson?.id);
  const href = (id: string) => `/dashboard/courses/${course.id}?lesson=${id}`;
  const visible = lessons.filter((l) =>
    `${l.title} ${l.section}`.toLowerCase().includes(query.toLowerCase()),
  );
  const groups = [...new Set(visible.map((l) => l.section || "কোর্সের লেসন"))];
  return (
    <div className="space-y-6">
      <Link className="text-sm text-primary" href="/dashboard/courses">
        ← আমার কোর্স
      </Link>
      <header className="sd-panel overflow-hidden grid md:grid-cols-[220px_1fr]">
        <div className="aspect-video md:aspect-auto">
          <CourseCover src={course.thumbnail_url} title={course.title} />
        </div>
        <div className="p-6 space-y-3">
          <p className="text-xs tracking-widest text-primary font-semibold">
            আপনার ক্লাসরুম
          </p>
          <h2 className="text-2xl font-bold">{course.title}</h2>
          <p className="text-muted-foreground whitespace-pre-wrap">
            {course.description}
          </p>
          <p className="text-sm">
            {bn(completed)}/{bn(lessons.length)} লেসন সম্পন্ন · {bn(percent)}%
            অগ্রগতি
          </p>
          <progress
            aria-label="কোর্সের অগ্রগতি"
            className="w-full accent-primary"
            max={100}
            value={percent}
          />
          {percent === 100 && (
            <p className="text-primary font-medium">
              সব লেসন সম্পন্ন! চাইলে আবার দেখে অনুশীলন করুন।
            </p>
          )}
        </div>
      </header>
      <div className="grid items-start gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="sd-panel p-4 space-y-4 xl:sticky xl:top-6">
          <h2 className="font-semibold">কোর্সে যা আছে</h2>
          <input
            className="w-full rounded-lg border bg-background p-2 text-sm"
            aria-label="লেসন খুঁজুন"
            placeholder="লেসন খুঁজুন…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <nav
            aria-label="কোর্সের লেসন"
            className="max-h-[65vh] overflow-y-auto space-y-5"
          >
            {groups.map((group) => (
              <div key={group}>
                <h3 className="text-xs font-semibold text-muted-foreground mb-2">
                  {group}
                </h3>
                <div className="space-y-1">
                  {visible
                    .filter((l) => (l.section || "কোর্সের লেসন") === group)
                    .map((l) => (
                      <Link
                        key={l.id}
                        href={href(l.id)}
                        scroll={false}
                        aria-current={l.id === lesson?.id ? "page" : undefined}
                        className={`block rounded-xl border p-3 ${l.id === lesson?.id ? "border-primary bg-primary/10" : "border-transparent hover:bg-muted"}`}
                      >
                        <span className="flex gap-2 items-start">
                          {done(l.id) ? (
                            <CheckCircle2
                              size={18}
                              className="mt-1 shrink-0 text-primary"
                            />
                          ) : (
                            <BookOpen size={18} className="mt-1 shrink-0" />
                          )}
                          <span className="text-sm font-medium">{l.title}</span>
                        </span>
                        <span className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          {l.video && (
                            <span className="flex gap-1">
                              <PlayCircle size={13} />
                              ভিডিও
                            </span>
                          )}
                          {l.pdf && <span>PDF</span>}
                          {l.text && <span>পাঠ</span>}
                          {l.duration && <span>{bn(l.duration)} মিনিট</span>}
                        </span>
                      </Link>
                    ))}
                </div>
              </div>
            ))}
            {!visible.length && (
              <p className="text-sm text-muted-foreground">
                {query
                  ? "কোনো লেসন মেলেনি।"
                  : "লেসন প্রকাশিত হলে এখানে দেখাবে।"}
              </p>
            )}
          </nav>
        </aside>
        <section
          aria-label="বর্তমান লেসন"
          className="sd-panel p-5 md:p-7 space-y-6 min-w-0"
        >
          {lesson ? (
            <>
              <div>
                <p className="text-sm text-muted-foreground">
                  লেসন {bn(index + 1)} / {bn(lessons.length)}
                </p>
                <h2 className="mt-2 text-xl font-bold">{lesson.title}</h2>
              </div>
              {lesson.videoUrl && (
                <CourseVideo url={lesson.videoUrl} title={lesson.title} />
              )}
              {lesson.content && (
                <section className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <FileText size={18} />
                    পাঠ ও নোট
                  </h3>
                  <div className="whitespace-pre-wrap break-words leading-8">
                    {lesson.content}
                  </div>
                </section>
              )}
              {lesson.pdfPath && (
                <a
                  className="flex items-center justify-between gap-3 rounded-xl border bg-muted/40 p-4 hover:bg-muted"
                  href={`/api/courses/${course.id}/lessons/${lesson.id}/pdf`}
                >
                  <span>
                    <strong className="block">লেসনের PDF নোট</strong>
                    <span className="text-sm text-muted-foreground">
                      ডাউনলোড করে অফলাইনে পড়ুন
                    </span>
                  </span>
                  <Download size={22} />
                </a>
              )}
              {!lesson.content && !lesson.videoUrl && !lesson.pdfPath && (
                <p className="text-muted-foreground">
                  এই লেসনের উপকরণ শীঘ্রই যোগ করা হবে।
                </p>
              )}
              <div className="border-t pt-5 flex flex-wrap gap-3 items-center justify-between">
                <Button
                  disabled={!ready || done(lesson.id)}
                  onClick={async () => {
                    setError("");
                    const result = await run("complete_lesson", {
                      id: lesson.id,
                    });
                    if (result?.data) router.refresh();
                    else setError("অগ্রগতি সংরক্ষণ হয়নি। আবার চেষ্টা করুন।");
                  }}
                >
                  <CheckCircle2 />
                  {done(lesson.id) ? "পড়া সম্পন্ন হয়েছে" : "পড়া সম্পন্ন করুন"}
                </Button>
                <div className="flex gap-4 text-sm text-primary">
                  {index > 0 && (
                    <Link href={href(lessons[index - 1].id)} scroll={false}>
                      ← আগের লেসন
                    </Link>
                  )}
                  {index < lessons.length - 1 && (
                    <Link href={href(lessons[index + 1].id)} scroll={false}>
                      পরের লেসন →
                    </Link>
                  )}
                </div>
              </div>
              {error && (
                <p role="alert" className="text-destructive">
                  {error}
                </p>
              )}
            </>
          ) : (
            <div className="py-12 text-center">
              <BookOpen className="mx-auto mb-4 text-primary" size={40} />
              <h2 className="text-xl font-semibold">
                আপনার কোর্স প্রস্তুত হচ্ছে
              </h2>
              <p className="mt-3 text-muted-foreground">
                প্রকাশিত লেসন এখানে দেখা যাবে। পরে আবার দেখুন।
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
