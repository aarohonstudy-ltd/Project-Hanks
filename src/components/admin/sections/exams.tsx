"use client";
import Crud from "../crud";
import { statusField } from "../editor";
import { Badge } from "../table";
import type { SectionProps } from "../panel";
import ReviewButton from "../review-button";
export default function Exams({ data, options }: SectionProps) {
  return (
    <>
      <Crud
        title="পরীক্ষা"
        action="exam_save"
        data={data}
        exam
        defaults={{
          status: "draft",
          exam_type: "model_test",
          duration_minutes: 30,
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
      {data.rows.some((r) => r.locked && r.status !== "archived") && (
        <div className="ad-guide">
          <h2>লক করা পরীক্ষা আর্কাইভ</h2>
          <p className="ad-hint">
            Active attempt শেষ হলে পুরোনো পরীক্ষা আর্কাইভ করা যায়। ফলাফল মুছে
            যাবে না।
          </p>
          {data.rows
            .filter((r) => r.locked && r.status !== "archived")
            .map((r) => (
              <div
                key={r.id}
                className="flex justify-between items-center gap-3 py-3"
              >
                <span>{String(r.title)}</span>
                <ReviewButton
                  label="আর্কাইভ"
                  description="পরীক্ষাটি তালিকা থেকে সরবে; আগের ফলাফল থাকবে। নিশ্চিত?"
                  action="exam_status"
                  payload={{ id: r.id, status: "archived" }}
                />
              </div>
            ))}
        </div>
      )}
    </>
  );
}
