import { NextResponse } from "next/server";
import { newsletterConfigured, newsletterDatabase, tokenHash } from "@/lib/newsletter/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!newsletterConfigured()) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  const body = await request.json().catch(() => null) as { token?: unknown } | null;
  const token = typeof body?.token === "string" ? body.token : "";
  if (token.length < 32 || token.length > 128) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const { data } = await newsletterDatabase().from("newsletter_subscribers").update({
    status: "unsubscribed", unsubscribed_at: new Date().toISOString(), confirmation_token_hash: null,
  }).eq("unsubscribe_token_hash", tokenHash(token)).select("id").maybeSingle();
  if (!data) return NextResponse.json({ error: "invalid" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
