"use client";
import type { SectionProps } from "../panel";
import DataTable, { Badge, date } from "../table";
import ReviewButton from "../review-button";
export default function Requests({ data }: SectionProps) {
  return (
    <>
      <div className="ad-toolbar">
        <p>
          পেইড কোর্সের পেমেন্ট আলাদাভাবে যাচাই করে অনুমোদন দিন। Approval কোর্স
          খুলে দেয়; payment record তৈরি করে না। Pending লিখে খুঁজলে অপেক্ষমান
          অনুরোধ পাবেন।
        </p>
      </div>
      <DataTable
        rows={data.rows}
        columns={[
          { key: "student_name", label: "শিক্ষার্থী" },
          { key: "email", label: "ইমেইল" },
          { key: "course_title", label: "কোর্স" },
          {
            key: "status",
            label: "অবস্থা",
            render: (r) => <Badge value={r.status} />,
          },
          {
            key: "created_at",
            label: "তারিখ (BD)",
            render: (r) => date(r.created_at),
          },
        ]}
        actions={(r) =>
          r.status === "pending" ? (
            <div className="flex gap-2">
              <ReviewButton
                label="অনুমোদন"
                description={`${String(r.student_name)}-কে ${String(r.course_title)} কোর্সে access দেওয়া হবে। প্রযোজ্য পেমেন্ট যাচাই করেছেন?`}
                action="request_review"
                payload={{ id: r.id, decision: "approved" }}
              />
              <ReviewButton
                label="প্রত্যাখ্যান"
                description="এই enrollment request প্রত্যাখ্যান করবেন?"
                action="request_review"
                payload={{ id: r.id, decision: "rejected" }}
              />
            </div>
          ) : (
            <span className="ad-hint">পর্যালোচিত</span>
          )
        }
      />
    </>
  );
}
