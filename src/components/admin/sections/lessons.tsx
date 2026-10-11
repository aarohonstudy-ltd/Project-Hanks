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
        {
          key: "section_title",
          label: "অধ্যায় / মডিউলের নাম",
          hint: "একই অধ্যায়ের লেসনে একই নাম দিন।",
        },
        {
          key: "duration_minutes",
          label: "ভিডিওর দৈর্ঘ্য (মিনিট, ঐচ্ছিক)",
          type: "number",
          min: 1,
          max: 1440,
          step: "1",
        },
        {
          key: "video_url",
          label: "YouTube বা ভিডিও URL",
          type: "url",
          hint: "YouTube watch / share link দিন। Public অথবা Unlisted এবং embedding চালু থাকতে হবে।",
        },
        { key: "pdf_path", label: "PDF নোট আপলোড", type: "pdf" },
        { key: "content", label: "পাঠের লেখা", type: "textarea" },
        statusField,
        {
          key: "is_preview",
          label: "Preview lesson",
          type: "checkbox",
          hint: "কোর্স ও লেসন Published থাকলে এই ভিডিওর লিংক হোমপেজে সবার জন্য দেখা যাবে।",
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
