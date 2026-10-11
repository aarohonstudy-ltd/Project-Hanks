"use client";
import Crud from "../crud";
import { statusField } from "../editor";
import { Badge } from "../table";
import type { SectionProps } from "../panel";
export default function Courses({ data, options }: SectionProps) {
  return (
    <Crud
      title="কোর্স"
      action="course_save"
      data={data}
      defaults={{ price: 0, status: "draft" }}
      hint="ফ্রি কোর্সের দাম 0 রাখুন। বিষয় যুক্ত করলে enrolled শিক্ষার্থী সেই বিষয়ের question bank পাবে।"
      fields={[
        { key: "title", label: "কোর্সের নাম", required: true },
        {
          key: "slug",
          label: "URL slug",
          required: true,
          hint: "যেমন: bcs-foundation-2026",
        },
        { key: "description", label: "বিবরণ", type: "textarea" },
        {
          key: "price",
          label: "দাম (৳)",
          type: "number",
          min: 0,
          step: "0.01",
          required: true,
        },
        {
          key: "offer_price",
          label: "অফার মূল্য (ঐচ্ছিক)",
          type: "number",
          min: 0,
          step: "0.01",
        },
        statusField,
        {
          key: "subject_ids",
          label: "অন্তর্ভুক্ত বিষয়",
          type: "multi",
          choices: options.subjects,
          hint: "একাধিক বেছে নিতে Mac-এ Command / Windows-এ Ctrl ধরে click করুন।",
        },
      ]}
      columns={[
        { key: "title", label: "কোর্স" },
        { key: "price", label: "মূল্য (৳)" },
        { key: "offer_price", label: "অফার (৳)" },
        {
          key: "status",
          label: "অবস্থা",
          render: (r) => <Badge value={r.status} />,
        },
      ]}
    />
  );
}
