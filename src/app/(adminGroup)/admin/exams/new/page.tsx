import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/admin/service";
import type { Options } from "@/lib/admin/types";
import NewExamForm from "@/components/admin/new-exam-form";

export const metadata: Metadata = {
  title: "নতুন পরীক্ষা | Admin | Aarohon",
  robots: { index: false, follow: false },
};

// Full-page form for creating an exam (replaces the cramped popup).
export default async function NewExamPage() {
  const { client } = await requireAdmin();
  const { data, error } = await client.rpc("aarohon_admin_options");
  return (
    <>
      <div className="ad-page-title">
        <div>
          <Link href="/admin/exams" className="ad-back-link">
            <ArrowLeft size={16} /> সব পরীক্ষা
          </Link>
          <h1>নতুন পরীক্ষা</h1>
          <p>
            সব সময় বাংলাদেশ সময় (UTC+6)। লাইভ পরীক্ষায় শুরু ও শেষ সময় আবশ্যক।
            প্রশ্ন যোগ করে Draft অথবা Published হিসেবে সংরক্ষণ করুন।
          </p>
        </div>
      </div>
      <section className="ad-page-form">
        {error || !data ? (
          <p role="alert" className="ad-form-error">
            কোর্সের তালিকা লোড হয়নি। পেজটি আবার লোড করুন।
          </p>
        ) : (
          <NewExamForm options={data as Options} />
        )}
      </section>
    </>
  );
}
