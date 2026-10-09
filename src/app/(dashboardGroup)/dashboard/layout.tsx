import type { ReactNode } from "react";
import type { Metadata } from "next";
import "../_components/student/student.css";
export const metadata: Metadata = {
  title: "স্টুডেন্ট ড্যাশবোর্ড | Aarohon",
  robots: { index: false, follow: false },
};
export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
