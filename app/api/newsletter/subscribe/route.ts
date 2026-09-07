import { NextResponse } from "next/server";
import { escapeHtml, issueToken, newsletterConfigured, newsletterDatabase, requestFingerprint, sendNewsletterEmail, siteUrl } from "@/lib/newsletter/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!newsletterConfigured()) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  const body = await request.json().catch(() => null) as { email?: unknown; lang?: unknown; website?: unknown } | null;
  if (body?.website) return NextResponse.json({ ok: true });
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const lang = body?.lang === "en" ? "en" : "uz";
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "invalid-email" }, { status: 400 });

  const database = newsletterDatabase();
  const fingerprint = requestFingerprint(request);
  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await database.from("newsletter_rate_limits").select("id", { count: "exact", head: true }).eq("fingerprint", fingerprint).gte("created_at", since);
  if ((count ?? 0) >= 5) return NextResponse.json({ error: "rate-limit" }, { status: 429 });
  await database.from("newsletter_rate_limits").insert({ fingerprint });

  const { data: existing } = await database.from("newsletter_subscribers").select("id,status").eq("email", email).maybeSingle();
  if (existing?.status === "active") return NextResponse.json({ ok: true, state: "confirmation-sent" });

  const confirmation = issueToken();
  const unsubscribe = issueToken();
  const values = {
    email, preferred_language: lang, status: "pending", confirmation_token_hash: confirmation.hash,
    unsubscribe_token_hash: unsubscribe.hash, confirmation_sent_at: new Date().toISOString(),
    confirmed_at: null, unsubscribed_at: null,
  };
  const result = existing
    ? await database.from("newsletter_subscribers").update(values).eq("id", existing.id).select("id").single()
    : await database.from("newsletter_subscribers").insert(values).select("id").single();
  if (result.error) return NextResponse.json({ error: "database" }, { status: 500 });

  const confirmUrl = `${siteUrl()}/api/newsletter/confirm?token=${encodeURIComponent(confirmation.token)}&lang=${lang}`;
  const subject = lang === "uz" ? "IZZATBEK-EDU-GROUP yangiliklariga obunani tasdiqlang" : "Confirm your IZZATBEK-EDU-GROUP newsletter subscription";
  const html = lang === "uz"
    ? `<h1>Obunani tasdiqlang</h1><p>Maktab yangiliklarini email orqali olish uchun quyidagi tugmani bosing.</p><p><a href="${confirmUrl}">Obunani tasdiqlash</a></p><p>Agar bu so‘rovni siz yubormagan bo‘lsangiz, xatni e’tiborsiz qoldiring.</p>`
    : `<h1>Confirm your subscription</h1><p>Use the link below to receive school news by email.</p><p><a href="${confirmUrl}">Confirm subscription</a></p><p>If you did not request this, you can ignore this email.</p>`;
  try {
    await sendNewsletterEmail({ to: email, subject: escapeHtml(subject), html });
  } catch {
    return NextResponse.json({ error: "email" }, { status: 502 });
  }
  return NextResponse.json({ ok: true, state: "confirmation-sent" });
}
