"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, MailCheck, RefreshCw, Send } from "lucide-react";
import { Lang } from "@/lib/site-content";

type Subscriber = { id: string; email: string; preferred_language: "uz" | "en"; status: "pending" | "active" | "unsubscribed"; created_at: string; confirmed_at: string | null };
type Campaign = { id: string; status: string; sent_count: number; failed_count: number; created_at: string; content_items: { title_uz: string; title_en: string } | null; events: { delivered: number; opened: number; clicked: number; bounced: number; complained: number } };

export function NewsletterDashboard({ lang }: { lang: Lang }) {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const filtered = useMemo(() => subscribers.filter((row) => (status === "all" || row.status === status) && row.email.includes(query.trim().toLowerCase())), [subscribers, query, status]);
  const totals = campaigns.reduce((sum, row) => ({ sent: sum.sent + row.sent_count, failed: sum.failed + row.failed_count, delivered: sum.delivered + row.events.delivered, opened: sum.opened + row.events.opened, clicked: sum.clicked + row.events.clicked }), { sent: 0, failed: 0, delivered: 0, opened: 0, clicked: 0 });

  async function load() {
    setBusy(true); setMessage("");
    const response = await fetch("/api/newsletter/admin", { cache: "no-store" }).catch(() => null);
    const payload = await response?.json().catch(() => ({})) as { subscribers?: Subscriber[]; campaigns?: Campaign[] };
    if (response?.ok) { setSubscribers(payload.subscribers ?? []); setCampaigns(payload.campaigns ?? []); }
    else setMessage(lang === "uz" ? "Newsletter ma’lumotlarini yuklab bo‘lmadi. Migratsiya va sozlamalarni tekshiring." : "Could not load newsletter data. Check the migration and configuration.");
    setBusy(false);
  }
  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function changeLanguage(id: string, preferredLanguage: "uz" | "en") {
    setSubscribers((current) => current.map((row) => row.id === id ? { ...row, preferred_language: preferredLanguage } : row));
    const response = await fetch("/api/newsletter/admin", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, preferredLanguage }) });
    if (!response.ok) { setMessage(lang === "uz" ? "Til saqlanmadi." : "Language was not saved."); await load(); }
  }

  async function sendTest() {
    setBusy(true); setMessage("");
    const response = await fetch("/api/newsletter/admin", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "send-test", language: lang }) }).catch(() => null);
    setMessage(response?.ok ? (lang === "uz" ? "Sinov xati administrator emailingizga yuborildi." : "A test was sent to your administrator email.") : (lang === "uz" ? "Sinov xati yuborilmadi." : "The test email could not be sent."));
    setBusy(false);
  }

  function exportCsv() {
    const csv = ["email,status,language,created_at,confirmed_at", ...filtered.map((row) => [row.email, row.status, row.preferred_language, row.created_at, row.confirmed_at ?? ""].map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))].join("\n");
    const link = document.createElement("a"); link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" })); link.download = `newsletter-subscribers-${new Date().toISOString().slice(0, 10)}.csv`; link.click(); URL.revokeObjectURL(link.href);
  }

  return <section className="newsletter-admin">
    <div className="newsletter-admin-heading"><div><p className="cms-kicker">Newsletter</p><h2>{lang === "uz" ? "Obunachilar va natijalar" : "Subscribers and results"}</h2></div><div><button className="button button-secondary" disabled={busy} onClick={() => void load()}><RefreshCw size={16} />{lang === "uz" ? "Yangilash" : "Refresh"}</button><button className="button button-primary" disabled={busy} onClick={() => void sendTest()}><Send size={16} />{lang === "uz" ? "Sinov xati" : "Send test"}</button></div></div>
    <div className="newsletter-kpis">{[
      [lang === "uz" ? "Faol" : "Active", subscribers.filter((r) => r.status === "active").length],
      [lang === "uz" ? "Kutilmoqda" : "Pending", subscribers.filter((r) => r.status === "pending").length],
      [lang === "uz" ? "Yuborilgan" : "Sent", totals.sent],
      [lang === "uz" ? "Yetkazilgan" : "Delivered", totals.delivered],
      [lang === "uz" ? "Ochilgan" : "Opened", totals.opened],
      [lang === "uz" ? "Bosilgan" : "Clicked", totals.clicked],
    ].map(([label, value]) => <article key={label}><MailCheck /><span>{label}</span><strong>{value}</strong></article>)}</div>
    {message && <p className="cms-message" role="status">{message}</p>}
    <div className="newsletter-table-card"><div className="newsletter-tools"><input aria-label={lang === "uz" ? "Email qidirish" : "Search email"} placeholder={lang === "uz" ? "Email qidirish…" : "Search email…"} value={query} onChange={(event) => setQuery(event.target.value.toLowerCase())} /><select aria-label={lang === "uz" ? "Holat" : "Status"} value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">{lang === "uz" ? "Barcha holatlar" : "All statuses"}</option><option value="active">Active</option><option value="pending">Pending</option><option value="unsubscribed">Unsubscribed</option></select><button className="button button-secondary" onClick={exportCsv}><Download size={16} />CSV</button></div>
      <div className="newsletter-scroll"><table><thead><tr><th>Email</th><th>{lang === "uz" ? "Holat" : "Status"}</th><th>{lang === "uz" ? "Til" : "Language"}</th><th>{lang === "uz" ? "Qo‘shilgan" : "Joined"}</th></tr></thead><tbody>{filtered.map((row) => <tr key={row.id}><td>{row.email}</td><td><span className={`status-pill ${row.status === "active" ? "published" : ""}`}>{row.status}</span></td><td><select value={row.preferred_language} onChange={(event) => void changeLanguage(row.id, event.target.value as "uz" | "en")}><option value="uz">O‘zbekcha</option><option value="en">English</option></select></td><td>{new Date(row.confirmed_at ?? row.created_at).toLocaleDateString(lang === "uz" ? "uz-UZ" : "en-GB")}</td></tr>)}</tbody></table></div>
    </div>
    <div className="newsletter-table-card"><h3>{lang === "uz" ? "Kampaniyalar" : "Campaigns"}</h3><div className="newsletter-scroll"><table><thead><tr><th>{lang === "uz" ? "Yangilik" : "Story"}</th><th>{lang === "uz" ? "Sana" : "Date"}</th><th>{lang === "uz" ? "Yuborildi" : "Sent"}</th><th>{lang === "uz" ? "Yetkazildi" : "Delivered"}</th><th>{lang === "uz" ? "Ochildi" : "Opened"}</th><th>{lang === "uz" ? "Bosildi" : "Clicked"}</th><th>{lang === "uz" ? "Xato" : "Failed"}</th></tr></thead><tbody>{campaigns.map((row) => <tr key={row.id}><td>{lang === "uz" ? row.content_items?.title_uz : row.content_items?.title_en}</td><td>{new Date(row.created_at).toLocaleDateString(lang === "uz" ? "uz-UZ" : "en-GB")}</td><td>{row.sent_count}</td><td>{row.events.delivered}</td><td>{row.events.opened}</td><td>{row.events.clicked}</td><td>{row.failed_count + row.events.bounced}</td></tr>)}</tbody></table></div></div>
    <p className="newsletter-privacy-note">{lang === "uz" ? "Eslatma: ochilish statistikasi email ilovalari maxfiylik himoyasi sabab taxminiy. Bosishlar va yetkazilish ko‘rsatkichlari odatda foydaliroq." : "Note: open counts are approximate because mail privacy features can preload images. Click and delivery metrics are generally more useful."}</p>
  </section>;
}
