import "server-only";
import { createClient } from "@supabase/supabase-js";
// Cookie-free anon client for public data, so pages using it can be statically cached.
export function publicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
