"use client";
import Crud from "../crud";
import type { SectionProps } from "../panel";
export default function Topics({ data, options }: SectionProps) {
  return (
    <Crud
      title="টপিক"
      action="topic_save"
      data={data}
      hint="বিদ্যমান টপিকের বিষয় বদলানো যায় না। অন্য বিষয়ের জন্য নতুন টপিক তৈরি করুন।"
      fields={[
        { key: "name", label: "টপিকের নাম", required: true },
        {
          key: "subject_id",
          label: "বিষয়",
          type: "select",
          choices: options.subjects,
          required: true,
        },
      ]}
      columns={[
        { key: "name", label: "টপিক" },
        { key: "subject_name", label: "বিষয়" },
      ]}
    />
  );
}
