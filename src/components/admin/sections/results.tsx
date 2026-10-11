"use client";
import type { SectionProps } from "../panel";
import DataTable, { Badge, date } from "../table";
export default function Results({ data }: SectionProps) {
  return (
    <>
      <div className="ad-toolbar">
        <p>
          পরীক্ষার server-graded ফলাফল। এটি read-only; practice session এখানে
          অন্তর্ভুক্ত নয়।
        </p>
      </div>
      <DataTable
        rows={data.rows}
        columns={[
          { key: "student_name", label: "শিক্ষার্থী" },
          { key: "exam_title", label: "পরীক্ষা" },
          { key: "score", label: "প্রাপ্ত নম্বর" },
          { key: "correct_count", label: "সঠিক" },
          { key: "wrong_count", label: "ভুল" },
          { key: "skipped_count", label: "বাদ" },
          {
            key: "status",
            label: "অবস্থা",
            render: (r) => <Badge value={r.status} />,
          },
          {
            key: "submitted_at",
            label: "জমা (BD)",
            render: (r) => date(r.submitted_at),
          },
        ]}
      />
    </>
  );
}
