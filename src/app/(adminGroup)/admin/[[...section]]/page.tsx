import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/service";
import { sections, type AdminData, type Options } from "@/lib/admin/types";
import AdminPanel from "@/components/admin/panel";
export const metadata: Metadata = {
  title: "Admin | Aarohon",
  robots: { index: false, follow: false },
};
export default async function AdminPage({
  params,
  searchParams,
}: {
  params: Promise<{ section?: string[] }>;
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { section: parts } = await params;
  const section = parts?.[0] ?? "overview";
  const found = sections.find(([s]) => s === section);
  if (!found || (parts && parts.length > 1)) notFound();
  const { client, name } = await requireAdmin();
  const query = await searchParams;
  const search = (query.q ?? "").slice(0, 200);
  const page = Math.max(1, Number.parseInt(query.page ?? "1", 10) || 1);
  const [list, options] = await Promise.all([
    client.rpc("aarohon_admin_data", {
      view_name: section,
      search_text: search,
      page_number: page,
    }),
    client.rpc("aarohon_admin_options"),
  ]);
  if (list.error || options.error)
    return (
      <main className="p-10 space-y-4">
        <h1 className="text-2xl">অ্যাডমিন প্যানেল প্রস্তুত নয়</h1>
        <p>
          Supabase SQL Editor-এ 005-এর পরে 006_admin_panel.sql চালান, তারপর
          refresh করুন।
        </p>
        <a href="/dashboard">স্টুডেন্ট পোর্টালে ফিরুন</a>
      </main>
    );
  return (
    <AdminPanel
      key={section + search + page}
      section={found[0]}
      name={name}
      data={list.data as AdminData}
      options={options.data as Options}
      search={search}
    />
  );
}
