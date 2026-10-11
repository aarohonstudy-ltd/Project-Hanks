import 'server-only';
import { demoHome } from './demo-data';
import type { HomeData } from './types';
export async function getHomeData(): Promise<HomeData> {
 // BACKEND: replace this return with your public API/DB query.
 // Example: fetch(`${process.env.API_URL}/public/home`, { cache: 'no-store' }).
 // Check response.ok and validate the returned JSON against HomeData.
 // Admin CRUD must be authorized server-side. Invalidate cached public data after edits.
 // Keep credentials in server env vars, never NEXT_PUBLIC_*.
 return demoHome;
}
