import type { Field, Options, ExamItem } from "@/lib/admin/types";
import { statusField } from "./editor";

// Exam form shared by the full-page "new exam" screen and the edit popup.
export function examFields(options: Options): Field[] {
  return [
    { key: "title", label: "পরীক্ষার নাম", required: true },
    {
      key: "exam_type",
      label: "ধরন",
      type: "select",
      required: true,
      choices: [
        { id: "model_test", title: "মডেল টেস্ট" },
        { id: "live", title: "লাইভ পরীক্ষা" },
      ],
    },
    {
      key: "course_id",
      label: "কোর্স (পেইড পরীক্ষায় আবশ্যক)",
      type: "select",
      choices: options.courses,
    },
    {
      key: "duration_minutes",
      label: "সময় (মিনিট)",
      type: "number",
      min: 1,
      step: "1",
      required: true,
    },
    {
      key: "pass_mark",
      label: "পাস নম্বর",
      type: "number",
      min: 0,
      step: "0.01",
      required: true,
      hint: "0 রাখলে পাস/ফেল দেখাবে না। মোট নম্বরের বেশি দেওয়া যাবে না।",
    },
    { key: "is_free", label: "সবার জন্য ফ্রি", type: "checkbox" },
    statusField,
    {
      key: "starts_at",
      label: "শুরু — বাংলাদেশ সময়",
      type: "datetime-local",
    },
    {
      key: "ends_at",
      label: "শেষ — বাংলাদেশ সময়",
      type: "datetime-local",
    },
    {
      key: "results_at",
      label: "ফল প্রকাশ — বাংলাদেশ সময়",
      type: "datetime-local",
      hint: "ফাঁকা হলে পরীক্ষা শেষ হওয়ার সময় ফল প্রকাশ হবে।",
    },
    {
      key: "answers_at",
      label: "উত্তর প্রকাশ — বাংলাদেশ সময়",
      type: "datetime-local",
      hint: "লাইভ পরীক্ষার জন্য নতুন প্রশ্ন ব্যবহার করুন।",
    },
  ];
}

export const examDefaults = {
  status: "draft",
  exam_type: "model_test",
  duration_minutes: 30,
  pass_mark: 0,
  is_free: true,
};

// Mirrors the database CHECK rules so mistakes show a clear message before saving.
export function validateExam(payload: Record<string, unknown>) {
  const items = (payload.items ?? []) as ExamItem[];
  const starts = payload.starts_at
    ? Date.parse(String(payload.starts_at))
    : NaN;
  const ends = payload.ends_at ? Date.parse(String(payload.ends_at)) : NaN;
  if (!payload.is_free && !payload.course_id)
    return "পেইড পরীক্ষার জন্য একটি কোর্স নির্বাচন করুন, অথবা “সবার জন্য ফ্রি” চালু করুন।";
  if (!(Number(payload.duration_minutes) >= 1))
    return "পরীক্ষার সময় (মিনিট) কমপক্ষে ১ দিন।";
  if (
    payload.exam_type === "live" &&
    (Number.isNaN(starts) || Number.isNaN(ends))
  )
    return "লাইভ পরীক্ষার জন্য শুরু ও শেষ — দুটো সময়ই দিন।";
  if (!Number.isNaN(ends) && Number.isNaN(starts))
    return "শেষের সময় দিলে শুরুর সময়ও দিন।";
  if (!Number.isNaN(starts) && !Number.isNaN(ends) && ends <= starts)
    return "শেষের সময় শুরুর সময়ের পরে হতে হবে।";
  if (payload.status === "published" && items.length === 0)
    return "প্রকাশ করার আগে অন্তত একটি প্রশ্ন যোগ করুন, অথবা Draft হিসেবে রাখুন।";
  const bad = items.findIndex(
    (q) => !(q.marks > 0) || q.negative_marks < 0 || q.negative_marks > q.marks,
  );
  if (bad >= 0)
    return `${bad + 1} নম্বর প্রশ্ন: নম্বর ০-এর বেশি দিন, আর কর্তন ০ থেকে নম্বরের মধ্যে রাখুন।`;
  const total = items.reduce((sum, q) => sum + q.marks, 0);
  if (payload.status === "published" && Number(payload.pass_mark) > total)
    return `পাস নম্বর মোট নম্বরের (${Math.round(total * 100) / 100}) বেশি হতে পারে না।`;
}
