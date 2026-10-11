import { NextRequest, NextResponse } from "next/server";
import { serverClient } from "@/lib/supabase/server";
export async function GET(request: NextRequest) {
  const client = await serverClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  let path = "/login";
  if (user) {
    const { data: p } = await client
      .from("profiles")
      .select("role,status")
      .eq("id", user.id)
      .single();
    path =
      p?.role === "admin" && p.status === "active" ? "/admin" : "/dashboard";
  }
  const r = NextResponse.redirect(new URL(path, request.url));
  r.headers.set("Cache-Control", "private, no-store");
  return r;
}
