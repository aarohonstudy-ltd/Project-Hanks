"use client";
import type { SectionProps } from "../panel";
import DataTable, { Badge, date } from "../table";
import ReviewButton from "../review-button";
export default function Students({ data }: SectionProps) {
  return (
    <>
      <div className="ad-toolbar">
        <p>
          Suspended account ব্যক্তিগত dashboard data ও নতুন কার্যক্রমে access
          পাবে না। Admin role শুধু SQL Editor থেকে পরিবর্তন করুন।
        </p>
      </div>
      <DataTable
        rows={data.rows}
        columns={[
          { key: "full_name", label: "নাম" },
          { key: "email", label: "ইমেইল" },
          { key: "role", label: "Role" },
          {
            key: "status",
            label: "অবস্থা",
            render: (r) => <Badge value={r.status} />,
          },
          {
            key: "created_at",
            label: "যোগদান (BD)",
            render: (r) => date(r.created_at),
          },
        ]}
        actions={(r) =>
          r.role === "admin" ? (
            <span className="ad-hint">Admin account</span>
          ) : (
            <ReviewButton
              label={r.status === "active" ? "Suspend" : "Activate"}
              description={`${String(r.email)} অ্যাকাউন্ট ${r.status === "active" ? "সাময়িক বন্ধ" : "সক্রিয়"} করবেন?`}
              action="student_status"
              payload={{
                id: r.id,
                status: r.status === "active" ? "suspended" : "active",
              }}
            />
          )
        }
      />
    </>
  );
}
