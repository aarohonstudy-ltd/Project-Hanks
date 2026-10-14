"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import ExamPreview from "../exam-builder/exam-preview";
import Crud from "../crud";
import { statusField } from "../editor";
import { Badge } from "../table";
import type { SectionProps } from "../panel";
export default function Exams({ data, options }: SectionProps) {
  const [previewId, setPreviewId] = useState<string>();
  return (
    <>
      <Crud
        title="পরীক্ষা"
        action="exam_save"
        entity="exam"
        lockedReason="কোনো শিক্ষার্থী অংশ নেওয়ার পর পরীক্ষা বদলালে তাদের ফলাফল ভুল হয়ে যাবে, তাই এটি লক থাকে। নতুন সংস্করণের জন্য “কপি করে নতুন” ব্যবহার করুন; পুরনোটি আর্কাইভ করতে পারবেন।"
        data={data}
        exam
        extraActions={(row) => (
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPreviewId(row.id)}
            >
              Preview / Demo
            </Button>
          </>
        )}
        defaults={{
          status: "draft",
          exam_type: "model_test",
          duration_minutes: 30,
          pass_mark: 0,
          is_free: true,
        }}
        hint="সব সময় বাংলাদেশ সময় (UTC+6)। Live পরীক্ষায় শুরু ও শেষ সময় আবশ্যক। Attempt শুরু হলে পরীক্ষা লক হয়।"
        fields={[
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
        ]}
        columns={[
          { key: "title", label: "পরীক্ষা" },
          { key: "exam_type", label: "ধরন" },
          { key: "duration_minutes", label: "মিনিট" },
          {
            key: "status",
            label: "অবস্থা",
            render: (r) => <Badge value={r.status} />,
          },
        ]}
      />
      {previewId && (
        <ExamPreview
          examId={previewId}
          onClose={() => setPreviewId(undefined)}
        />
      )}
    </>
  );
}
