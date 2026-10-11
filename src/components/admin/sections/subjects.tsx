"use client";
import Crud from "../crud";
import type { SectionProps } from "../panel";
export default function Subjects({ data }: SectionProps) {
  return (
    <Crud
      title="বিষয়"
      action="subject_save"
      data={data}
      hint="প্রথমে বিষয় তৈরি করুন, তারপর এর অধীনে টপিক যোগ করুন।"
      fields={[{ key: "name", label: "বিষয়ের নাম", required: true }]}
      columns={[{ key: "name", label: "বিষয়" }]}
    />
  );
}
