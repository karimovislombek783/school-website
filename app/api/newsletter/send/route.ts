import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { escapeHtml, issueToken, newsletterConfigured, newsletterDatabase, sendNewsletterEmail, siteUrl } from "@/lib/newsletter/server";

export const runtime = "nodejs";
export const maxDuration = 60;

type NewsRow = { id: string; slug: string; title_uz: string; title_en: string; summary_uz: string; summary_en: string; body_uz: string | null; body_en: string | null };
type SubscriberRow = { id: string; email: string; preferred_language: "uz" | "en" };

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

  const database = newsletterDatabase();
  const { data: news } = await database.from("content_items").select("id,slug,title_uz,title_en,summary_uz,summary_en,body_uz,body_en").eq("id", newsId).eq("type", "news").eq("status", "published").maybeSingle();
  if (!news) return NextResponse.json({ error: "not-published" }, { status: 404 });

  const { data: campaign, error: campaignError } = await database.from("newsletter_campaigns").insert({ news_id: newsId, initiated_by: userData.user.id, status: "sending" }).select("id").single();
  if (campaignError?.code === "23505") return NextResponse.json({ error: "already-sent" }, { status: 409 });
  if (campaignError || !campaign) return NextResponse.json({ error: "database" }, { status: 500 });

  const { data: subscriberData, error: subscriberError } = await database.from("newsletter_subscribers").select("id,email,preferred_language").eq("status", "active").limit(500);
  if (subscriberError) {
    await database.from("newsletter_campaigns").update({ status: "failed", completed_at: new Date().toISOString() }).eq("id", campaign.id);
    return NextResponse.json({ error: "database" }, { status: 500 });
  }

  const subscribers = (subscriberData ?? []) as SubscriberRow[];
  let sent = 0;
  let failed = 0;
  for (const subscriber of subscribers) {
    const unsubscribe = issueToken();
    await database.from("newsletter_subscribers").update({ unsubscribe_token_hash: unsubscribe.hash }).eq("id", subscriber.id);
    const providerId = await deliver(news as NewsRow, subscriber, unsubscribe.token).catch(() => null);
    if (providerId) sent += 1; else failed += 1;
    await database.from("newsletter_deliveries").insert({
      campaign_id: campaign.id, subscriber_id: subscriber.id, status: providerId ? "sent" : "failed",
      provider_message_id: providerId, sent_at: providerId ? new Date().toISOString() : null,
    });
  }
  await database.from("newsletter_campaigns").update({ status: failed ? "completed_with_errors" : "completed", sent_count: sent, failed_count: failed, completed_at: new Date().toISOString() }).eq("id", campaign.id);
  await database.from("audit_log").insert({ actor_id: userData.user.id, action: "newsletter_send", record_id: newsId, record_type: "news" });
  return NextResponse.json({ ok: true, sent, failed });
}

async function deliver(news: NewsRow, subscriber: SubscriberRow, unsubscribeToken: string) {
  const lang = subscriber.preferred_language === "en" ? "en" : "uz";
  const title = lang === "uz" ? news.title_uz : news.title_en;
  const summary = lang === "uz" ? news.summary_uz : news.summary_en;
  const body = (lang === "uz" ? news.body_uz : news.body_en) ?? "";
  const articleUrl = `${siteUrl()}/${lang}/news/${encodeURIComponent(news.slug)}`;
  const unsubscribeUrl = `${siteUrl()}/${lang}/newsletter/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}`;
  const paragraphs = body.split(/\n\s*\n/).map((value) => value.trim()).filter(Boolean).slice(0, 3);
  const html = `<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#12223d"><p style="color:#195489;font-weight:700">IZZATBEK-EDU-GROUP</p><h1>${escapeHtml(title)}</h1><p>${escapeHtml(summary)}</p>${paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}<p><a href="${articleUrl}">${lang === "uz" ? "Yangilikni saytda o‘qish" : "Read the full story on our website"}</a></p><hr><p style="font-size:12px;color:#607087">${lang === "uz" ? "Bu xatni maktab yangiliklariga obuna bo‘lganingiz uchun oldingiz." : "You received this email because you subscribed to school news."} <a href="${unsubscribeUrl}">${lang === "uz" ? "Obunani bekor qilish" : "Unsubscribe"}</a></p></div>`;
  return sendNewsletterEmail({ to: subscriber.email, subject: title, html });
}
