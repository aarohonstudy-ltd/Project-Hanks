import "server-only";
import { studentDemo } from "./demo-data";
import type { StudentData } from "./types";
/** Supabase integration boundary. Replace the demo return with authenticated,
 * user-scoped queries for profiles, enrollments, attempts and notifications.
 * Require a verified session and RLS. Grade real exams on the server; never
 * send answer keys to a browser before submission. No auth is implemented here. */
export async function getStudentDashboard(): Promise<StudentData> {
  return studentDemo;
}
