import Home from "@/app/(publicGroup)/_components/academy/home";
import { getHomeData } from "@/lib/academy/service";
import "../home.css";

export default async function Page() {
  return <Home data={await getHomeData()} />;
}
