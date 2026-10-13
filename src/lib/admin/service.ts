import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { serverClient } from "@/lib/supabase/server";
// Memoized only within the current server render; never shared between users.
export const requireAdmin = cache(async function requireAdmin() {
  const client = await serverClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) redirect("/login");
  const { data: session, error: sessionError } = await client.rpc(
    "aarohon_session_status",
  );
  if (sessionError) throw new Error("Session verification unavailable");
  if (!session?.valid) redirect("/login?reason=session-expired");
  const { data: profile } = await client
    .from("profiles")
    .select("full_name,role,status")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin" || profile.status !== "active")
    redirect("/admin-denied");
  return { client, session, name: profile.full_name || user.email || "Admin" };
});
