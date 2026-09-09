import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { newsletterDatabase } from "@/lib/newsletter/server";

export const runtime = "nodejs";

type WebhookPayload = { type?: string; created_at?: string; data?: { email_id?: string; click?: { link?: string } } };

export async function POST(request: Request) {
  const raw = await request.text();
  if (!verify(request.headers, raw)) return NextResponse.json({ error: "invalid-signature" }, { status: 401 });
  const payload = JSON.parse(raw) as WebhookPayload;
  const messageId = payload.data?.email_id;
  const eventId = request.headers.get("svix-id");
  if (!eventId || !messageId || !payload.type) return NextResponse.json({ error: "invalid-payload" }, { status: 400 });
  const db = newsletterDatabase();
  const occurredAt = payload.created_at && !Number.isNaN(Date.parse(payload.created_at)) ? payload.created_at : new Date().toISOString();
  const { error: eventError } = await db.from("newsletter_events").insert({ provider_event_id: eventId, provider_message_id: messageId, event_type: payload.type, occurred_at: occurredAt, clicked_url: payload.data?.click?.link ?? null });
  if (eventError?.code === "23505") return NextResponse.json({ ok: true, duplicate: true });
  if (eventError) return NextResponse.json({ error: "database" }, { status: 500 });
  const update: Record<string, string> = { last_event_at: occurredAt };
  if (payload.type === "email.delivered") update.delivered_at = occurredAt;
  if (payload.type === "email.opened") update.first_opened_at = occurredAt;
  if (payload.type === "email.clicked") update.first_clicked_at = occurredAt;
  if (payload.type === "email.bounced") update.bounced_at = occurredAt;
  if (payload.type === "email.complained") update.complained_at = occurredAt;
  await db.from("newsletter_deliveries").update(update).eq("provider_message_id", messageId);
  return NextResponse.json({ ok: true });
}

function verify(headers: Headers, body: string) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  const id = headers.get("svix-id");
  const timestamp = headers.get("svix-timestamp");
  const signatures = headers.get("svix-signature");
  if (!secret || !id || !timestamp || !signatures || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;
  try {
    const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
    const expected = createHmac("sha256", key).update(`${id}.${timestamp}.${body}`).digest();
    return signatures.split(" ").some((part) => {
      const value = part.startsWith("v1,") ? part.slice(3) : "";
      const actual = Buffer.from(value, "base64");
      return actual.length === expected.length && timingSafeEqual(actual, expected);
    });
  } catch { return false; }
}
