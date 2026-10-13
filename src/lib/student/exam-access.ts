import type { Course, Exam } from "./types";
export function examAccess(exam: Exam, courses: Course[]) {
  const course = courses.find((c) => c.id === exam.courseId);
  const locked = exam.isFree === false && !course?.enrolled;
  const reason = !locked
    ? ""
    : !course
      ? "এই পরীক্ষার কোর্সের তথ্য পাওয়া যায়নি। কর্তৃপক্ষের সঙ্গে যোগাযোগ করুন।"
      : course.pending
        ? `“${course.title}” কোর্সে আপনার ভর্তির অনুরোধ অনুমোদনের অপেক্ষায় আছে।`
        : `এই পরীক্ষা দিতে “${course.title}” কোর্সে সক্রিয় enrollment প্রয়োজন।`;
  return { course, locked, reason };
}
