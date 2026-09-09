import { NextResponse } from "next/server";
import { requireNewsletterAdmin } from "@/lib/newsletter/admin";
import { newsletterConfigured, newsletterDatabase, sendNewsletterEmail, siteUrl } from "@/lib/newsletter/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!newsletterConfigured()) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  const auth = await requireNewsletterAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const db = newsletterDatabase();
  const [subscribers, campaigns, deliveries] = await Promise.all([
    db.from("newsletter_subscribers").select("id,email,preferred_language,status,created_at,confirmed_at,unsubscribed_at").order("created_at", { ascending: false }).limit(500),
    db.from("newsletter_campaigns").select("id,news_id,status,sent_count,failed_count,created_at,completed_at,content_items(title_uz,title_en)").order("created_at", { ascending: false }).limit(50),
    db.from("newsletter_deliveries").select("campaign_id,status,delivered_at,first_opened_at,first_clicked_at,bounced_at,complained_at"),
  ]);
  const error = subscribers.error || campaigns.error || deliveries.error;
  if (error) return NextResponse.json({ error: "database", details: error.message }, { status: 500 });
  const eventsByCampaign = new Map<string, { delivered: number; opened: number; clicked: number; bounced: number; complained: number }>();
  for (const row of deliveries.data ?? []) {
    const counts = eventsByCampaign.get(row.campaign_id) ?? { delivered: 0, opened: 0, clicked: 0, bounced: 0, complained: 0 };
    if (row.delivered_at) counts.delivered++;
    if (row.first_opened_at) counts.opened++;
    if (row.first_clicked_at) counts.clicked++;
    if (row.bounced_at) counts.bounced++;
    if (row.complained_at) counts.complained++;
    eventsByCampaign.set(row.campaign_id, counts);
  }
  return NextResponse.json({
    subscribers: subscribers.data ?? [],
    campaigns: (campaigns.data ?? []).map((row) => ({ ...row, events: eventsByCampaign.get(row.id) ?? { delivered: 0, opened: 0, clicked: 0, bounced: 0, complained: 0 } })),
  });
}

export async function PATCH(request: Request) {
  const auth = await requireNewsletterAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (tooLarge(request)) return NextResponse.json({ error: "payload-too-large" }, { status: 413 });
  const body = await request.json().catch(() => null) as { id?: unknown; preferredLanguage?: unknown } | null;
  if (typeof body?.id !== "string" || !["uz", "en"].includes(String(body.preferredLanguage))) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const db = newsletterDatabase();
  const { error } = await db.from("newsletter_subscribers").update({ preferred_language: body.preferredLanguage, updated_at: new Date().toISOString() }).eq("id", body.id);
  if (error) return NextResponse.json({ error: "database" }, { status: 500 });
  await db.from("audit_log").insert({ actor_id: auth.user.id, action: "newsletter_language_update", record_id: body.id, record_type: "newsletter_subscriber" });
  return NextResponse.json({ ok: true });
}

export async function POST(request: Request) {
  const auth = await requireNewsletterAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  if (tooLarge(request)) return NextResponse.json({ error: "payload-too-large" }, { status: 413 });
  const body = await request.json().catch(() => null) as { action?: unknown; language?: unknown } | null;
  if (body?.action !== "send-test" || !auth.user.email) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const lang = body.language === "en" ? "en" : "uz";
  const subject = lang === "uz" ? "Newsletter sinov xati" : "Newsletter test email";
  const text = lang === "uz" ? "Newsletter yuborish sozlamalari ishlayapti. Bu faqat administratorga yuborilgan sinov xati." : "Your newsletter sending configuration works. This test was sent only to the administrator.";
  await sendNewsletterEmail({ to: auth.user.email, subject, html: `<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#12223d"><h1>${subject}</h1><p>${text}</p><p><a href="${siteUrl()}/${lang}">IZZATBEK-EDU-GROUP</a></p></div>` });
  return NextResponse.json({ ok: true });
}

function tooLarge(request: Request) {
  const size = Number(request.headers.get("content-length") ?? "0");
  return !Number.isFinite(size) || size > 16_384;
}
