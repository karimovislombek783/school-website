import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { sendCampaign } from "@/lib/newsletter/campaign";
import { newsletterConfigured } from "@/lib/newsletter/server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  if (!newsletterConfigured()) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  const body = await request.json().catch(() => null) as { newsId?: unknown } | null;
  const newsId = typeof body?.newsId === "string" ? body.newsId : "";
  if (!/^[0-9a-f-]{36}$/i.test(newsId)) return NextResponse.json({ error: "invalid-news" }, { status: 400 });

  const sessionClient = await createServerSupabase();
  const { data: userData } = await sessionClient.auth.getUser();
  if (!userData.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { data: assurance } = await sessionClient.auth.mfa.getAuthenticatorAssuranceLevel();
  if (assurance?.currentLevel !== "aal2") return NextResponse.json({ error: "mfa-required" }, { status: 403 });
  const { data: membership } = await sessionClient.from("admin_users").select("role,active").eq("user_id", userData.user.id).maybeSingle();
  if (!membership?.active || !["owner", "administrator"].includes(membership.role)) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const result = await sendCampaign(newsId, userData.user.id);
  if (!result.ok) {
    const status = result.error === "already-sent" ? 409 : result.error === "not-published" ? 404 : 500;
    return NextResponse.json({ error: result.error }, { status });
  }
  return NextResponse.json(result);
}
