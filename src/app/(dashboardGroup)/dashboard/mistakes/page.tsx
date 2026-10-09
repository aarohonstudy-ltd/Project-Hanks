import StudentDashboard from "../../_components/student/dashboard";
import { getStudentDashboard } from "@/lib/student/service";
export default async function Page() {
  return (
    <StudentDashboard section="mistakes" data={await getStudentDashboard()} />
  );
}
