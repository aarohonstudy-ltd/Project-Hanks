import Home from "@/app/(publicGroup)/_components/academy/home";
import { getHomeData } from "@/lib/academy/service";
import "../home.css";
// Public data; admin saves also revalidate this page immediately.
export const revalidate = 300;

export default async function Page() {
  return <Home data={await getHomeData()} />;
}
