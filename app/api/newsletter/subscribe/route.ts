import { NextResponse } from "next/server";
import {
  escapeHtml,
  issueToken,
  newsletterConfigured,
  newsletterDatabase,
  requestFingerprint,
  sendNewsletterEmail,
  siteUrl,
} from "@/lib/newsletter/server";

export const runtime = "nodejs";

type SubscribeBody = {
  email?: unknown;
  lang?: unknown;
  website?: unknown;
};

export async function POST(request: Request) {
  if (!newsletterConfigured()) {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }

  try {
    const declaredSize = Number(request.headers.get("content-length") ?? "0");
    if (!Number.isFinite(declaredSize) || declaredSize > 16_384) return NextResponse.json({ error: "payload-too-large" }, { status: 413 });
    const body = await request.json().catch(() => null) as SubscribeBody | null;

    // Honeypot: silently accept bot submissions without doing any work.
    if (body?.website) return NextResponse.json({ ok: true });

    const email =
      typeof body?.email === "string"
        ? body.email.trim().toLowerCase()
        : "";
    const lang = body?.lang === "en" ? "en" : "uz";

    if (
      email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return NextResponse.json({ error: "invalid-email" }, { status: 400 });
    }

    const database = newsletterDatabase();
    await database.from("newsletter_rate_limits").delete().lt("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
    const fingerprint = requestFingerprint(request);
    const since = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const rateLimitResult = await database
      .from("newsletter_rate_limits")
      .select("id", { count: "exact", head: true })
      .eq("fingerprint", fingerprint)
      .gte("created_at", since);

    if (rateLimitResult.error) {
      console.error("[newsletter/subscribe] rate-limit lookup failed", rateLimitResult.error);
      return NextResponse.json({ error: "database" }, { status: 500 });
    }

    if ((rateLimitResult.count ?? 0) >= 5) {
      return NextResponse.json({ error: "rate-limit" }, { status: 429 });
    }

    const rateLimitInsert = await database
      .from("newsletter_rate_limits")
      .insert({ fingerprint });

    if (rateLimitInsert.error) {
      console.error("[newsletter/subscribe] rate-limit insert failed", rateLimitInsert.error);
      return NextResponse.json({ error: "database" }, { status: 500 });
    }

    const existingResult = await database
      .from("newsletter_subscribers")
      .select("id,status")
      .eq("email", email)
      .maybeSingle();

    if (existingResult.error) {
      console.error("[newsletter/subscribe] subscriber lookup failed", existingResult.error);
      return NextResponse.json({ error: "database" }, { status: 500 });
    }

    const existing = existingResult.data;

    if (existing?.status === "active") {
      return NextResponse.json({ ok: true, state: "confirmation-sent" });
    }

    const confirmation = issueToken();
    const unsubscribe = issueToken();

    const values = {
      email,
      preferred_language: lang,
      status: "pending",
      confirmation_token_hash: confirmation.hash,
      unsubscribe_token_hash: unsubscribe.hash,
      confirmation_sent_at: new Date().toISOString(),
      confirmed_at: null,
      unsubscribed_at: null,
    };

    const result = existing
      ? await database
          .from("newsletter_subscribers")
          .update(values)
          .eq("id", existing.id)
          .select("id")
          .single()
      : await database
          .from("newsletter_subscribers")
          .insert(values)
          .select("id")
          .single();

    if (result.error) {
      console.error("[newsletter/subscribe] subscriber write failed", result.error);
      return NextResponse.json({ error: "database" }, { status: 500 });
    }

    const confirmUrl =
      `${siteUrl()}/api/newsletter/confirm?token=${encodeURIComponent(confirmation.token)}&lang=${lang}`;

    const subject =
      lang === "uz"
        ? "IZZATBEK-EDU-GROUP yangiliklariga obunani tasdiqlang"
        : "Confirm your IZZATBEK-EDU-GROUP newsletter subscription";

    const html =
      lang === "uz"
        ? `<h1>Obunani tasdiqlang</h1><p>Maktab yangiliklarini email orqali olish uchun quyidagi tugmani bosing.</p><p><a href="${confirmUrl}">Obunani tasdiqlash</a></p><p>Agar bu so‘rovni siz yubormagan bo‘lsangiz, xatni e’tiborsiz qoldiring.</p>`
        : `<h1>Confirm your subscription</h1><p>Use the link below to receive school news by email.</p><p><a href="${confirmUrl}">Confirm subscription</a></p><p>If you did not request this, you can ignore this email.</p>`;

    try {
      await sendNewsletterEmail({
        to: email,
        subject: escapeHtml(subject),
        html,
      });
    } catch (error) {
      console.error("[newsletter/subscribe] confirmation email failed", error);
      return NextResponse.json({ error: "email" }, { status: 502 });
    }

    return NextResponse.json({ ok: true, state: "confirmation-sent" });
  } catch (error) {
    console.error("[newsletter/subscribe] unexpected error", error);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
