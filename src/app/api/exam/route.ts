import { serverClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const reply = (body: unknown, status = 200) =>
    NextResponse.json(body, {
      status,
      headers: { "Cache-Control": "no-store" },
    });
  // Cookie-authenticated endpoint, including sendBeacon. No cross-site mutation.
  const origin = request.headers.get("origin");
  try {
    if (!origin || new URL(origin).host !== request.headers.get("host"))
      return reply({ error: "Invalid origin" }, 403);
  } catch {
    return reply({ error: "Invalid origin" }, 403);
  }
  if (Number(request.headers.get("content-length") || 0) > 64000)
    return reply({ error: "Request too large" }, 413);
  if (request.headers.get("sec-fetch-site") === "cross-site")
    return reply({ error: "Invalid origin" }, 403);
  try {
    const text = await request.text();
    if (new TextEncoder().encode(text).length > 64000)
      return reply({ error: "Request too large" }, 413);
    const { action, payload } = JSON.parse(text);
    if (!["sync", "submit"].includes(action))
      return reply({ error: "Invalid action" }, 400);
    const client = await serverClient();
    const {
      data: { user },
    } = await client.auth.getUser();
    if (!user)
      return reply(
        { error: "সেশন শেষ হয়েছে। আবার login করে পরীক্ষা Resume করুন।" },
        401,
      );
    const { data, error } = await client.rpc("aarohon_exam_action", {
      action_name: action,
      payload,
    });
    if (error)
      return reply(
        {
          error: ["P0001", "PT401"].includes(error.code)
            ? error.message
            : "উত্তর save হয়নি। আবার চেষ্টা হচ্ছে।",
        },
        error.code === "PT401" ? 401 : 400,
      );
    return reply(data);
  } catch {
    return reply({ error: "সংযোগের সমস্যা। আবার চেষ্টা হচ্ছে।" }, 503);
  }
}
