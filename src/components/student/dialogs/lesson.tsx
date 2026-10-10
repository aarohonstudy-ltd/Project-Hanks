"use client";
import { useDashboard } from "@/components/student/dashboard-context";
import { bn } from "@/components/student/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Check } from "lucide-react";

export default function LessonDialog() {
  const {
    saved,
    ready,
    setNotice,
    course,
    setCourse,
    lesson,
    setLesson,
    update,
  } = useDashboard();
  return (
    <Dialog
      open={!!course}
      onOpenChange={(open) => {
        if (!open) setCourse(null);
      }}
    >
      <DialogContent className="sd-dialog">
        <DialogHeader>
          <DialogTitle>{course?.title}</DialogTitle>
          <DialogDescription>
            নমুনা পাঠ · ভিডিও ও পূর্ণ কনটেন্ট পরে যুক্ত হবে
          </DialogDescription>
        </DialogHeader>
        {course && (
          <>
            <div className="sd-lesson-tabs">
              {course.lessons.map((name, i) => (
                <button
                  key={name}
                  className={lesson === i ? "active" : ""}
                  onClick={() => setLesson(i)}
                >
                  {i < (saved.completed[course.id] ?? course.completed)
                    ? "✓ "
                    : ""}
                  {bn(i + 1)}. {name}
                </button>
              ))}
            </div>
            <article className="sd-lesson">
              <span className="sd-chip">পাঠ {bn(lesson + 1)}</span>
              <h2>{course.lessons[lesson]}</h2>
              <p>
                এই পাঠটি আপনার প্রস্তুতির একটি ছোট অনুশীলন। বিষয়টি পড়ার সময় মূল
                সংজ্ঞা ও গুরুত্বপূর্ণ তথ্য নিজের ভাষায় নোট করুন।
              </p>
              <ol>
                <li>আজকের বিষয়ের জন্য ২০ মিনিট সময় নির্ধারণ করুন।</li>
                <li>মূল ধারণাগুলো পড়ুন এবং তিনটি গুরুত্বপূর্ণ বিষয় লিখুন।</li>
                <li>
                  প্রশ্ন ব্যাংক থেকে সংশ্লিষ্ট বিষয়ের প্রশ্ন অনুশীলন করুন।
                </li>
                <li>ভুল উত্তরের ব্যাখ্যা পড়ে আবার চেষ্টা করুন।</li>
              </ol>
              <p>
                সম্পূর্ণ কোর্স কনটেন্ট ও ভিডিও পরবর্তী backend সংযোগের সময় যুক্ত
                করা হবে।
              </p>
              <Button
                disabled={
                  !ready ||
                  lesson > (saved.completed[course.id] ?? course.completed)
                }
                onClick={() => {
                  update({
                    ...saved,
                    completed: {
                      ...saved.completed,
                      [course.id]: Math.max(
                        saved.completed[course.id] ?? course.completed,
                        lesson + 1,
                      ),
                    },
                  });
                  if (lesson < course.lessons.length - 1) setLesson(lesson + 1);
                  else setCourse(null);
                  setNotice("লেসনের অগ্রগতি সংরক্ষণ হয়েছে।");
                }}
              >
                <Check />
                পাঠ সম্পন্ন করুন
              </Button>
              {lesson > (saved.completed[course.id] ?? course.completed) && (
                <p>আগের পাঠগুলো আগে সম্পন্ন করুন।</p>
              )}
            </article>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
