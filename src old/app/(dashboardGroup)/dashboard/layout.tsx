import type { ReactNode } from "react";
import type { Metadata } from "next";
import StudentDashboard from "@/components/student/dashboard";
import { getStudentDashboard } from "@/lib/student/service";
import "@/components/student/student.css";
export const metadata: Metadata = {
  title: "স্টুডেন্ট ড্যাশবোর্ড | Aarohon",
  robots: { index: false, follow: false },
};
export default async function Layout({ children }: { children: ReactNode }) {
  const data = await getStudentDashboard();
  return <StudentDashboard data={data}>{children}</StudentDashboard>;
}
