import { NextRequest, NextResponse } from "next/server";
import { serverClient } from "@/lib/supabase/server";
export async function GET(request: NextRequest) {
  const redirect = (path: string) => {
    const response = NextResponse.redirect(new URL(path, request.url));
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  };
  const code = request.nextUrl.searchParams.get("code");
  if (!code) return redirect("/login?error=callback");
  try {
    const client = await serverClient();
    const { data, error } = await client.auth.exchangeCodeForSession(code);
    if (error || !data.user) return redirect("/login?error=callback");
    // The verified code exchange already provides the authenticated user.
    const { data: profile, error: profileError } = await client
      .from("profiles")
      .select("role,status")
      .eq("id", data.user.id)
      .single();
    if (profileError || !profile) return redirect("/auth/landing");
    return redirect(
      profile.role === "admin" && profile.status === "active"
        ? "/admin"
        : "/dashboard",
    );
  } catch {
    return redirect("/login?error=callback");
  }
}
