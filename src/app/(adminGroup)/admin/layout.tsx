import type { ReactNode } from "react";
import { requireAdmin } from "@/lib/admin/service";
import AdminShell from "@/components/admin/shell";
export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { name } = await requireAdmin();
  return <AdminShell name={name}>{children}</AdminShell>;
}
