import { NextResponse } from "next/server";
import { newsletterConfigured, newsletterDatabase, siteUrl, tokenHash } from "@/lib/newsletter/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const lang = url.searchParams.get("lang") === "en" ? "en" : "uz";
  const token = url.searchParams.get("token") ?? "";
  let status = "invalid";
  if (newsletterConfigured() && token.length >= 32 && token.length <= 128) {
    const notBefore = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data } = await newsletterDatabase().from("newsletter_subscribers").update({
      status: "active", confirmed_at: new Date().toISOString(), confirmation_token_hash: null, unsubscribed_at: null,
    }).eq("confirmation_token_hash", tokenHash(token)).eq("status", "pending").gte("confirmation_sent_at", notBefore).select("id").maybeSingle();
    if (data) status = "confirmed";
  }
  return NextResponse.redirect(`${siteUrl()}/${lang}/newsletter/confirmed?status=${status}`, 303);
}
