"use client";
import Crud from "../crud";
import { statusField } from "../editor";
import { Badge } from "../table";
import type { SectionProps } from "../panel";
export default function Lessons({ data, options }: SectionProps) {
  return (
    <Crud
      title="লেসন"
      action="lesson_save"
      data={data}
      defaults={{ position: 1, status: "draft", is_preview: false }}
      hint="প্রতিটি কোর্সে lesson position আলাদা রাখুন। ভিডিওর HTTPS link দেওয়া যাবে।"
      fields={[
        { key: "title", label: "লেসনের নাম", required: true },
        {
          key: "course_id",
          label: "কোর্স",
          type: "select",
          choices: options.courses,
          required: true,
        },
        {
          key: "position",
          label: "ক্রম (1, 2, 3...)",
          type: "number",
          min: 0,
          step: "1",
          required: true,
        },
        { key: "video_url", label: "ভিডিও URL", type: "url" },
        { key: "content", label: "পাঠের লেখা", type: "textarea" },
        statusField,
        {
          key: "is_preview",
          label: "Preview lesson",
          type: "checkbox",
          hint: "Preview অনুমতি সংরক্ষিত হয়; public preview player এই প্যানেলের অংশ নয়।",
        },
      ]}
      columns={[
        { key: "title", label: "লেসন" },
        { key: "course_title", label: "কোর্স" },
        { key: "position", label: "ক্রম" },
        {
          key: "status",
          label: "অবস্থা",
          render: (r) => <Badge value={r.status} />,
        },
      ]}
    />
  );
}
