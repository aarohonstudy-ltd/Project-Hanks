"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import ExamPreview from "../exam-builder/exam-preview";
import Crud from "../crud";
import { examDefaults, examFields, validateExam } from "../exam-fields";
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
        defaults={examDefaults}
        validate={validateExam}
        newHref="/admin/exams/new"
        hint="সব সময় বাংলাদেশ সময় (UTC+6)। Live পরীক্ষায় শুরু ও শেষ সময় আবশ্যক। Attempt শুরু হলে পরীক্ষা লক হয়।"
        fields={examFields(options)}
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
