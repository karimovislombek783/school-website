import { NextResponse } from "next/server";
import { newsletterDatabase } from "@/lib/newsletter/server";
import { sendCampaign } from "@/lib/newsletter/campaign";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const secret = process.env.SCHEDULER_SECRET;
  if (!secret || request.headers.get("x-scheduler-secret") !== secret) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const database = newsletterDatabase();
  const now = new Date().toISOString();

  const { data: duePublications, error: publicationError } = await database.from("content_items").select("id").eq("status", "scheduled").lte("scheduled_publish_at", now).limit(100);
  if (publicationError) return NextResponse.json({ error: "publication-query" }, { status: 500 });
  const publicationIds = (duePublications ?? []).map((row) => row.id);
  if (publicationIds.length) {
    const { error } = await database.from("content_items").update({ status: "published", scheduled_publish_at: null }).in("id", publicationIds);
    if (error) return NextResponse.json({ error: "publication-update" }, { status: 500 });
  }

  const { data: dueNewsletters, error: newsletterError } = await database.from("content_items").select("id").eq("type", "news").eq("status", "published").not("newsletter_scheduled_at", "is", null).lte("newsletter_scheduled_at", now).order("newsletter_scheduled_at").limit(10);
  if (newsletterError) return NextResponse.json({ error: "newsletter-query" }, { status: 500 });
  const results = [];
  for (const item of dueNewsletters ?? []) results.push({ id: item.id, ...(await sendCampaign(item.id, null)) });
  return NextResponse.json({ ok: true, published: publicationIds.length, newsletters: results });
}
