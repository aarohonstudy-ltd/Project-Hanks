"use client";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { SectionProps } from "../panel";
export default function Overview({ data }: SectionProps) {
  const cards = [
    ["students", "শিক্ষার্থী", "students"],
    ["courses", "প্রকাশিত কোর্স", "courses"],
    ["questions", "প্রকাশিত প্রশ্ন", "questions"],
    ["requests", "অপেক্ষমান অনুরোধ", "requests"],
    ["exams", "প্রকাশিত পরীক্ষা", "exams"],
    ["attempts", "জমা দেওয়া পরীক্ষা", "results"],
  ];
  return (
    <>
      <div className="ad-stats">
        {cards.map(([key, label, href]) => (
          <Link href={`/admin/${href}`} key={key} className="ad-stat">
            <div className="flex justify-between items-center">
              <p>{label}</p>
              <ArrowUpRight size={16} />
            </div>
            <strong>{(data.counts?.[key] ?? 0).toLocaleString("bn-BD")}</strong>
            <p>বিস্তারিত দেখুন →</p>
          </Link>
        ))}
      </div>
      <section className="ad-guide">
        <h2>কনটেন্ট প্রকাশের ধাপ</h2>
        <ol className="list-decimal pl-5 space-y-2">
          <li>
            <Link className="underline" href="/admin/subjects">
              বিষয়
            </Link>{" "}
            ও টপিক তৈরি করুন।
          </li>
          <li>কোর্স তৈরি করে বিষয় যুক্ত করুন এবং লেসন যোগ করুন।</li>
          <li>প্রশ্ন, অপশন ও সঠিক উত্তর দিয়ে প্রশ্ন Published করুন।</li>
          <li>
            পরীক্ষায় প্রশ্ন যোগ করে সময়, নম্বর এবং প্রকাশের অবস্থা ঠিক করুন।
          </li>
          <li>স্টুডেন্ট পোর্টাল থেকে প্রকাশিত কনটেন্ট পরীক্ষা করুন।</li>
        </ol>
        <p className="ad-hint mt-4">
          এখানকার course/content student dashboard-এ ব্যবহৃত হয়। Public homepage
          এখনও আগের promotional content দেখায়।
        </p>
      </section>
    </>
  );
}
