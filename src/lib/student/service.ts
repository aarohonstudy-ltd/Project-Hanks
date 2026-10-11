import { serverClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { StudentData } from "./types";
export async function getStudentDashboard(): Promise<StudentData> {
  const client = await serverClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) redirect("/login");
  const { data, error } = await client.rpc("aarohon_dashboard");
  if (error)
    throw new Error(
      "Dashboard unavailable. Run supabase/005_dashboard_runtime.sql and check account status.",
    );
  return data as StudentData;
}
