"use client";
import type { StudentData } from "@/lib/student/types";
import type { ReactNode } from "react";
import { DashboardProvider } from "./dashboard-context";
import ExamDialog from "./dialogs/exam";
import LessonDialog from "./dialogs/lesson";
import NotificationsDialog from "./dialogs/notifications";
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
        <NotificationsDialog />
        <ExamDialog />
        <ResultsDialog />
        <LessonDialog />
      </div>
    </DashboardProvider>
  );
}
