import "server-only";

import { batchesOf, NEWSLETTER_RECIPIENT_LIMIT } from "@/lib/editorial-scheduling";
import { escapeHtml, issueToken, newsletterDatabase, sendNewsletterBatch, siteUrl } from "@/lib/newsletter/server";

type AuthorRow = { name: string; role_uz: string; role_en: string };
type NewsRow = { id: string; slug: string; title_uz: string; title_en: string; summary_uz: string; summary_en: string; body_uz: string | null; body_en: string | null; publication_authors: AuthorRow | AuthorRow[] | null };
type SubscriberRow = { id: string; email: string; preferred_language: "uz" | "en" };

export async function sendCampaign(newsId: string, initiatedBy: string | null) {
  const database = newsletterDatabase();
  const { data: news } = await database.from("content_items").select("id,slug,title_uz,title_en,summary_uz,summary_en,body_uz,body_en,publication_authors(name,role_uz,role_en)").eq("id", newsId).eq("type", "news").eq("status", "published").maybeSingle();
  if (!news) return { ok: false as const, error: "not-published" as const };

  const { data: campaign, error: campaignError } = await database.from("newsletter_campaigns").insert({ news_id: newsId, initiated_by: initiatedBy, status: "sending" }).select("id").single();
  if (campaignError?.code === "23505") return { ok: false as const, error: "already-sent" as const };
  if (campaignError || !campaign) return { ok: false as const, error: "database" as const };

  const { data: subscriberData, error: subscriberError } = await database.from("newsletter_subscribers").select("id,email,preferred_language").eq("status", "active").limit(NEWSLETTER_RECIPIENT_LIMIT);
  if (subscriberError) {
    await database.from("newsletter_campaigns").update({ status: "failed", completed_at: new Date().toISOString() }).eq("id", campaign.id);
    return { ok: false as const, error: "database" as const };
  }

  let sent = 0;
  let failed = 0;
  for (const group of batchesOf((subscriberData ?? []) as SubscriberRow[])) {
    const prepared = group.map((subscriber) => ({ subscriber, unsubscribe: issueToken() }));
    await Promise.all(prepared.map(({ subscriber, unsubscribe }) => database.from("newsletter_subscribers").update({ unsubscribe_token_hash: unsubscribe.hash }).eq("id", subscriber.id)));
    const messages = prepared.map(({ subscriber, unsubscribe }) => buildMessage(news as NewsRow, subscriber, unsubscribe.token));
    const providerIds = await sendNewsletterBatch(messages).catch(() => messages.map(() => null));
    const deliveries = prepared.map(({ subscriber }, index) => {
      const providerId = providerIds[index] ?? null;
      if (providerId) sent += 1; else failed += 1;
      return { campaign_id: campaign.id, subscriber_id: subscriber.id, status: providerId ? "sent" : "failed", provider_message_id: providerId, sent_at: providerId ? new Date().toISOString() : null };
    });
    await database.from("newsletter_deliveries").insert(deliveries);
  }

  await database.from("newsletter_campaigns").update({ status: failed ? "completed_with_errors" : "completed", sent_count: sent, failed_count: failed, completed_at: new Date().toISOString() }).eq("id", campaign.id);
  await database.from("content_items").update({ newsletter_scheduled_at: null }).eq("id", newsId);
  await database.from("audit_log").insert({ actor_id: initiatedBy, action: "newsletter_send", record_id: newsId, record_type: "news" });
  return { ok: true as const, sent, failed };
}

function buildMessage(news: NewsRow, subscriber: SubscriberRow, unsubscribeToken: string) {
  const lang = subscriber.preferred_language === "en" ? "en" : "uz";
  const title = lang === "uz" ? news.title_uz : news.title_en;
  const summary = lang === "uz" ? news.summary_uz : news.summary_en;
  const body = (lang === "uz" ? news.body_uz : news.body_en) ?? "";
  const articleUrl = `${siteUrl()}/${lang}/news/${encodeURIComponent(news.slug)}`;
  const unsubscribeUrl = `${siteUrl()}/${lang}/newsletter/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}`;
  const paragraphs = body.split(/\n\s*\n/).map((value) => value.trim()).filter(Boolean).slice(0, 3);
  const author = Array.isArray(news.publication_authors) ? news.publication_authors[0] : news.publication_authors;
  const byline = author ? `<p style="font-size:13px;color:#607087">${lang === "uz" ? "Muallif" : "Written by"}: <strong>${escapeHtml(author.name)}</strong> · ${escapeHtml(lang === "uz" ? author.role_uz : author.role_en)}</p>` : "";
  const html = `<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#12223d"><p style="color:#195489;font-weight:700">IZZATBEK-EDU-GROUP</p><h1>${escapeHtml(title)}</h1>${byline}<p>${escapeHtml(summary)}</p>${paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}<p><a href="${articleUrl}">${lang === "uz" ? "Nashrni saytda o‘qish" : "Read the full publication on our website"}</a></p><hr><p style="font-size:12px;color:#607087">${lang === "uz" ? "Bu xatni maktab nashrlariga obuna bo‘lganingiz uchun oldingiz." : "You received this email because you subscribed to school publications."} <a href="${unsubscribeUrl}">${lang === "uz" ? "Obunani bekor qilish" : "Unsubscribe"}</a></p></div>`;
  return { to: subscriber.email, subject: title, html };
}
