"use client";
import SessionGuard from "@/components/auth/session-guard";
import type { StudentData } from "@/lib/student/types";
import type { ReactNode } from "react";
import { DashboardProvider } from "./dashboard-context";
import ExamDialog from "./dialogs/exam";
import ResultsDialog from "./dialogs/results";
import DashboardHeader from "./header";
import DashboardPageFrame from "./page-frame";
import DashboardSidebar from "./sidebar";
export default function StudentDashboard({
  data,
  children,
}: {
  data: StudentData;
  children: ReactNode;
}) {
  return (
    <DashboardProvider data={data}>
      <SessionGuard initial={data.session} />
      <div className="sd-app" lang="bn">
        <a className="sd-skip" href="#student-main">
          মূল কনটেন্টে যান
        </a>
        <aside className="sd-sidebar">
          <DashboardSidebar />
        </aside>
        <div className="sd-workspace">
          <DashboardHeader />
          <DashboardPageFrame>{children}</DashboardPageFrame>
        </div>
        <ExamDialog />
        <ResultsDialog />
      </div>
    </DashboardProvider>
  );
}
