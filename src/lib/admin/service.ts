import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { serverClient } from "@/lib/supabase/server";
// Memoized only within the current server render; never shared between users.
export const requireAdmin = cache(async function requireAdmin() {
  const client = await serverClient();
  // Local JWT check; session lifetime and role are verified by the database below.
  const { data: auth } = await client.auth.getClaims();
  const claims = auth?.claims;
  if (!claims?.sub) redirect("/login");
  const [{ data: session, error: sessionError }, { data: profile }] =
    await Promise.all([
      client.rpc("aarohon_session_status"),
      client
        .from("profiles")
        .select("full_name,role,status")
        .eq("id", claims.sub)
        .single(),
    ]);
  if (sessionError) throw new Error("Session verification unavailable");
  if (!session?.valid) redirect("/login?reason=session-expired");
  if (profile?.role !== "admin" || profile.status !== "active")
    redirect("/admin-denied");
  return {
    client,
    session,
    name: profile.full_name || claims.email || "Admin",
  };
});
