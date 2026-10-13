import SessionGuard from "@/components/auth/session-guard";
import type { ReactNode } from "react";
import { requireAdmin } from "@/lib/admin/service";
import AdminShell from "@/components/admin/shell";
export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { name, session } = await requireAdmin();
  return (
    <>
      <SessionGuard initial={session} />
      <AdminShell name={name}>{children}</AdminShell>
    </>
  );
}
