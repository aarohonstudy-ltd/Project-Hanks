"use client";
import { useDashboard } from "../dashboard-context";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
export default function LessonDialog() {
  const {
    data,
    course,
    setCourse,
    lesson,
    lessonData,
    openLesson,
    ready,
    run,
  } = useDashboard();
  const video = lessonData?.videoUrl;
  let safeVideo: string | undefined;
  try {
    if (video && new URL(video).protocol === "https:") safeVideo = video;
  } catch {}
  return (
    <Dialog
      open={!!course}
      onOpenChange={(o) => {
        if (!o) setCourse(null);
      }}
    >
      <DialogContent className="sd-dialog">
        <DialogHeader>
          <DialogTitle>{course?.title}</DialogTitle>
          <DialogDescription>প্রকাশিত কোর্সের পাঠ</DialogDescription>
        </DialogHeader>
        {course && (
          <>
            <div className="sd-lesson-tabs">
              {course.lessons.map((name, i) => (
                <button
                  disabled={!ready}
                  className={lesson === i ? "active" : ""}
                  key={course.lessonIds?.[i] ?? i}
                  onClick={() => openLesson(course, i)}
                >
                  {data.completedLessonIds?.includes(
                    course.lessonIds?.[i] ?? "",
                  )
                    ? "✓ "
                    : ""}
                  {name}
                </button>
              ))}
            </div>
            <article className="sd-lesson">
              <h2>{lessonData?.title}</h2>
              <p className="whitespace-pre-wrap">
                {lessonData?.content || "এই পাঠে এখনো লিখিত কনটেন্ট নেই।"}
              </p>
              {safeVideo && (
                <a
                  href={safeVideo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  ভিডিও দেখুন
                </a>
              )}
              <Button
                disabled={!ready || !lessonData}
                onClick={() => run("complete_lesson", { id: lessonData?.id })}
              >
                পাঠ সম্পন্ন করুন
              </Button>
            </article>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
