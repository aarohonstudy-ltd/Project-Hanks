"use client";
import { useDashboard } from "@/components/student/dashboard-context";
import { ChevronRight, Trophy } from "lucide-react";
import Link from "next/link";
import { type ReactNode } from "react";

export default function DashboardPageFrame({
  children,
}: {
  children: ReactNode;
}) {
  const { section, notice, setNotice, title } = useDashboard();
  return (
    <main id="student-main" className="sd-main">
      <div className="sd-page-title">
        <div>
          <p className="sd-eyebrow">YOUR LEARNING SPACE</p>
          <h1>{section === "overview" ? "ড্যাশবোর্ড ওভারভিউ" : title}</h1>
          <p>প্রতিদিন একটু এগিয়ে, স্বপ্নের আরও কাছে।</p>
        </div>
        <Link href="/dashboard/leaderboard" className="sd-rank-link">
          <Trophy size={17} /> লিডারবোর্ড <ChevronRight size={15} />
        </Link>
      </div>
      {notice && (
        <div className="sd-notice" role="status">
          {notice}
          <button aria-label="বার্তা বন্ধ করুন" onClick={() => setNotice("")}>
            ×
          </button>
        </div>
      )}

      {children}
      <footer className="sd-footer">
        <span>© 2026 আরোহণ · শেখার পথে আপনার সঙ্গী</span>
        <span>স্টুডেন্ট পোর্টাল</span>
      </footer>
    </main>
  );
}
