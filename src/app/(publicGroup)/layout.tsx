import type { ReactNode } from "react";
import Navbar from "@/components/shared/nevbar";
import Footer from "@/components/shared/footer";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
      <Footer />
    </>
  );
}
