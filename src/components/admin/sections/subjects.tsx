"use client";
import Crud from "../crud";
import { Badge } from "../table";
import type { SectionProps } from "../panel";
export default function Subjects({ data }: SectionProps) {
  return (
    <Crud
      title="বিষয়"
      action="subject_save"
      entity="subject"
      data={data}
      hint="প্রথমে বিষয় তৈরি করুন, তারপর এর অধীনে টপিক যোগ করুন।"
      fields={[{ key: "name", label: "বিষয়ের নাম", required: true }]}
      columns={[
        { key: "name", label: "বিষয়" },
        {
          key: "archived_at",
          label: "অবস্থা",
          render: (r) => (
            <Badge value={r.archived_at ? "archived" : "active"} />
          ),
        },
      ]}
    />
  );
}
