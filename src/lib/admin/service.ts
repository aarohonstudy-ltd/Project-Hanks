import "server-only";
import { redirect } from "next/navigation";
import { serverClient } from "@/lib/supabase/server";
export async function requireAdmin() {
  const client = await serverClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await client
    .from("profiles")
    .select("full_name,role,status")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin" || profile.status !== "active")
    redirect("/admin-denied");
  return { client, name: profile.full_name || user.email || "Admin" };
}
