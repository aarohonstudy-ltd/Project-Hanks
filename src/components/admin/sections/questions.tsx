"use client";
import Crud from "../crud";
import { statusField } from "../editor";
import { Badge } from "../table";
import type { SectionProps } from "../panel";
export default function Questions({ data, options }: SectionProps) {
  return (
    <Crud
      title="প্রশ্ন"
      action="question_save"
      data={data}
      question
      defaults={{ status: "draft", difficulty: "medium" }}
      hint="Published পরীক্ষায় যুক্ত বা ইতোমধ্যে ব্যবহৃত প্রশ্ন লক থাকে। সংশোধনের জন্য নতুন প্রশ্ন তৈরি করুন।"
      fields={[
        {
          key: "question_text",
          label: "প্রশ্ন",
          type: "textarea",
          required: true,
        },
        {
          key: "topic_id",
          label: "টপিক",
          type: "select",
          choices: options.topics,
          required: true,
        },
        {
          key: "difficulty",
          label: "কঠিনতা",
          type: "select",
          required: true,
          choices: [
            { id: "easy", title: "সহজ" },
            { id: "medium", title: "মাঝারি" },
            { id: "hard", title: "কঠিন" },
          ],
        },
        {
          key: "options_text",
          label: "উত্তরের অপশন — প্রতি লাইনে একটি",
          type: "textarea",
          required: true,
          hint: "2 থেকে 8টি অপশন লিখুন। ফাঁকা লাইন রাখবেন না।",
        },
        {
          key: "correct_number",
          label: "সঠিক অপশনের নম্বর (1 থেকে শুরু)",
          type: "number",
          min: 1,
          max: 8,
          step: "1",
          required: true,
        },
        { key: "explanation", label: "ব্যাখ্যা", type: "textarea" },
        statusField,
      ]}
      columns={[
        { key: "question_text", label: "প্রশ্ন" },
        { key: "topic_name", label: "টপিক" },
        { key: "difficulty", label: "কঠিনতা" },
        {
          key: "status",
          label: "অবস্থা",
          render: (r) => <Badge value={r.status} />,
        },
      ]}
    />
  );
}
