import { serverClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { StudentData } from "./types";
export async function getStudentDashboard(): Promise<StudentData> {
  const client = await serverClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) redirect("/login");
  const [dashboardResult, profileResult] = await Promise.all([
    client.rpc("aarohon_dashboard"),
    client.from("profiles").select("role").eq("id", user.id).single(),
  ]);
  if (dashboardResult.error || !dashboardResult.data)
    throw new Error(
      "Dashboard unavailable. Check database connectivity, migrations and account status.",
    );
  const data = dashboardResult.data;
  const profile = profileResult.data;
  const dashboard = data as StudentData;
  dashboard.profile.role = profile?.role;
  return dashboard;
}
