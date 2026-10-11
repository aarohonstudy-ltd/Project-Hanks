import Section from "@/components/student/sections/leaderboard";
import { loadLeaderboard } from "@/lib/student/leaderboard-actions";
export default async function Page() {
  const result = await loadLeaderboard();
  return <Section initial={result.data} initialError={result.error} />;
}
