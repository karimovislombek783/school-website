"use client";

import { FormEvent, useState } from "react";
import { CheckCircle2, Mail } from "lucide-react";
import { Lang } from "@/lib/site-content";

export function NewsletterSignup({ lang, compact = false }: { lang: Lang; compact?: boolean }) {
  const [state, setState] = useState<"idle" | "busy" | "sent" | "error" | "limited">("idle");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state === "busy") return;
    setState("busy");
    const form = event.currentTarget;
    const data = new FormData(form);
    const response = await fetch("/api/newsletter/subscribe", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: data.get("email"), website: data.get("website"), lang }),
    }).catch(() => null);
    if (!response) return setState("error");
    await response.json().catch(() => ({}));
    if (response.ok) { setState("sent"); form.reset(); }
    else setState(response.status === 429 ? "limited" : "error");
  }
  const successful = state === "sent";
  return <section id="newsletter" className={`newsletter-signup ${compact ? "compact" : ""}`} aria-labelledby={`newsletter-title-${compact ? "compact" : "main"}`}>
    <div className="newsletter-signup-copy"><span className="newsletter-icon"><Mail aria-hidden="true" /></span><div><p className="eyebrow">{lang === "uz" ? "Email yangiliklari" : "Email newsletter"}</p><h2 id={`newsletter-title-${compact ? "compact" : "main"}`}>{lang === "uz" ? "Maktab yangiliklarini kuzatib boring" : "Keep up with school news"}</h2><p>{lang === "uz" ? "Yangi e’lon va yangiliklarni emailingizga oling. Faqat tasdiqlangan xabarlar yuboriladi." : "Receive new announcements and stories by email. We send only approved school updates."}</p></div></div>
    {successful ? <p className="newsletter-feedback success" role="status"><CheckCircle2 />{lang === "uz" ? "Agar manzil yangi bo‘lsa, tasdiqlash xati yuborildi. Emailingizni tekshiring." : "If this address is new, a confirmation email was sent. Please check your inbox."}</p> : <form className="newsletter-subscribe-form" onSubmit={submit}>
      <label><span className="sr-only">Email</span><input name="email" type="email" inputMode="email" autoComplete="email" required maxLength={254} placeholder={lang === "uz" ? "Email manzilingiz" : "Your email address"} /></label>
      <label className="newsletter-honeypot" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
      <button className="button button-primary" disabled={state === "busy"}>{state === "busy" ? (lang === "uz" ? "Yuborilmoqda…" : "Sending…") : (lang === "uz" ? "Obuna bo‘lish" : "Subscribe")}</button>
      <small>{lang === "uz" ? "Obunani tasdiqlash talab qilinadi. Istalgan vaqtda bekor qilishingiz mumkin." : "Email confirmation is required. You may unsubscribe at any time."}</small>
      {(state === "error" || state === "limited") && <p className="newsletter-feedback error" role="alert">{state === "limited" ? (lang === "uz" ? "Juda ko‘p urinish. Bir soatdan keyin qayta urinib ko‘ring." : "Too many attempts. Please try again in one hour.") : (lang === "uz" ? "Hozir obuna qilib bo‘lmadi. Keyinroq qayta urinib ko‘ring." : "We could not subscribe you right now. Please try again later.")}</p>}
    </form>}
  </section>;
}

export function NewsletterUnsubscribe({ lang, token }: { lang: Lang; token: string }) {
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  async function unsubscribe() {
    setState("busy");
    const response = await fetch("/api/newsletter/unsubscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) }).catch(() => null);
    setState(response?.ok ? "done" : "error");
  }
  return <div className="newsletter-status-card"><Mail /><h1>{lang === "uz" ? "Email obunasini boshqarish" : "Manage your email subscription"}</h1>{state === "done" ? <p>{lang === "uz" ? "Obuna muvaffaqiyatli bekor qilindi." : "You have been successfully unsubscribed."}</p> : <><p>{lang === "uz" ? "Maktab yangiliklarini emailingizga olishni to‘xtatmoqchimisiz?" : "Would you like to stop receiving school news by email?"}</p><button className="button button-primary" onClick={unsubscribe} disabled={state === "busy" || !token}>{state === "busy" ? (lang === "uz" ? "Bajarilmoqda…" : "Processing…") : (lang === "uz" ? "Obunani bekor qilish" : "Unsubscribe")}</button>{state === "error" && <p role="alert">{lang === "uz" ? "Havola yaroqsiz yoki eskirgan." : "This link is invalid or expired."}</p>}</>}</div>;
}
