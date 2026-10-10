"use client";
import { bn } from "@/components/student/navigation";
import { Trophy } from "lucide-react";
export default function LeaderboardSection() {
  return (
    <section className="sd-panel sd-leaderboard">
      <h2>প্রস্তুতির অনুপ্রেরণা</h2>
      <p>নিচের তালিকাটি সম্পূর্ণ নমুনা; এটি আপনার বাস্তব র‍্যাঙ্ক নয়।</p>
      {[
        { name: "শিক্ষার্থী এক", score: 98 },
        { name: "শিক্ষার্থী দুই", score: 94 },
        { name: "শিক্ষার্থী তিন", score: 90 },
      ].map((p, i) => (
        <div key={p.name}>
          <span className="sd-icon amber">
            <Trophy size={19} />
          </span>
          <strong>#{bn(i + 1)}</strong>
          <span>{p.name}</span>
          <b>{bn(p.score)} / ১০০</b>
        </div>
      ))}
    </section>
  );
}
