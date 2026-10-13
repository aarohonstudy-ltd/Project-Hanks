import { serverClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { StudentData } from "./types";
export async function getStudentDashboard(): Promise<StudentData> {
  const started = performance.now();
  const client = await serverClient();
  // PostgREST validates the JWT; this secured RPC checks the actual Auth session,
  // its age and active profile in the database (014). No duplicate Auth/profile trip.
  const dashboardResult = await client.rpc("aarohon_dashboard");
  const totalMs = Math.round(performance.now() - started);
  if (totalMs > 1500) console.warn("[aarohon:dashboard]", { totalMs });
  if (dashboardResult.error?.code === "PT401")
    redirect("/login?reason=session-expired");
  if (dashboardResult.status === 401 || dashboardResult.error?.code === "42501")
    redirect("/login");
  if (dashboardResult.error || !dashboardResult.data)
    throw new Error(
      "Dashboard unavailable. Check database connectivity, migrations and account status.",
    );
  return dashboardResult.data as StudentData;
}
