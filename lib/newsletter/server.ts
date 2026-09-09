import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

export function newsletterConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY &&
      process.env.RESEND_API_KEY
  );
}

export function newsletterDatabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Newsletter database is not configured.");

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function issueToken() {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: tokenHash(token) };
}

export function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function requestFingerprint(request: Request) {
  const forwarded =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const agent =
    request.headers.get("user-agent")?.slice(0, 180) ?? "unknown";

  return createHash("sha256")
    .update(
      `${forwarded}|${agent}|${process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""}`
    )
    .digest("hex");
}

export function siteUrl() {
  return (
    process.env.NEWSLETTER_SITE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://www.izzatbek-edu-group.uz"
  ).replace(/\/$/, "");
}

export function escapeHtml(value: string) {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[character] ?? character
  );
}

export async function sendNewsletterEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("Newsletter email is not configured.");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from:
        process.env.NEWSLETTER_FROM_EMAIL ||
        process.env.NEWSLETTER_FROM ||
        "IZZATBEK-EDU-GROUP <news@izzatbek-edu-group.uz>",
      to: [to],
      subject,
      html,
    }),
    cache: "no-store",
  });

  const payload = (await response.json().catch(() => ({}))) as {
    id?: string;
    message?: string;
  };

  if (!response.ok || !payload.id) {
    throw new Error(
      payload.message || `Email provider returned ${response.status}.`
    );
  }

  return payload.id;
}

export type NewsletterEmail = { to: string; subject: string; html: string };

export async function sendNewsletterBatch(messages: NewsletterEmail[]) {
  if (!messages.length || messages.length > 100) throw new Error("A newsletter batch must contain 1–100 messages.");
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("Newsletter email is not configured.");
  const from = process.env.NEWSLETTER_FROM_EMAIL || process.env.NEWSLETTER_FROM || "IZZATBEK-EDU-GROUP <news@izzatbek-edu-group.uz>";
  const response = await fetch("https://api.resend.com/emails/batch", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(messages.map((message) => ({ from, to: [message.to], subject: message.subject, html: message.html }))),
    cache: "no-store",
  });
  const payload = await response.json().catch(() => ({})) as { data?: Array<{ id?: string }>; message?: string };
  if (!response.ok || !Array.isArray(payload.data) || payload.data.length !== messages.length) {
    throw new Error(payload.message || `Email provider returned ${response.status}.`);
  }
  return payload.data.map((item) => item.id ?? null);
}
