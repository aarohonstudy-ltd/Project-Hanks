"use client";
import type { SectionProps } from "../panel";
import DataTable, { date } from "../table";
export default function Audit({ data }: SectionProps) {
  return (
    <>
      <div className="ad-toolbar">
        <p>
          এই অ্যাডমিন প্যানেল দিয়ে সফলভাবে করা পরিবর্তনগুলোর লগ। SQL Editor-এ
          সরাসরি পরিবর্তন এই তালিকায় থাকে না।
        </p>
      </div>
      <DataTable
        rows={data.rows}
        columns={[
          { key: "action", label: "কাজ" },
          { key: "actor_name", label: "অ্যাডমিন" },
          { key: "entity_type", label: "বিভাগ" },
          { key: "entity_id", label: "রেকর্ড ID" },
          {
            key: "created_at",
            label: "সময় (BD)",
            render: (r) => date(r.created_at),
          },
        ]}
      />
    </>
  );
}
