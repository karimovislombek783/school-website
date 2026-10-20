"use client";

import { FormEvent, useState } from "react";
import { PenLine, Plus } from "lucide-react";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { Lang } from "@/lib/site-content";

export type PublicationAuthor = { id: string; name: string; role_uz: string; role_en: string; bio_uz: string | null; bio_en: string | null; profile_published: boolean; active: boolean };

export type AuthorContribution = { id: string; author_id: string | null; title_uz: string; title_en: string; status: "draft" | "scheduled" | "published" };

export function WriterManager({ lang, authors, onChange, articles = [], onOpenArticle }: { lang: Lang; authors: PublicationAuthor[]; onChange: (authors: PublicationAuthor[]) => void; articles?: AuthorContribution[]; onOpenArticle?: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PublicationAuthor | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return; setBusy(true); setMessage("");
    try {
    const data = new FormData(event.currentTarget);
    const payload = { name: String(data.get("name") || "").trim(), role_uz: String(data.get("role_uz") || "Muallif").trim(), role_en: String(data.get("role_en") || "Writer").trim(), bio_uz: String(data.get("bio_uz") || "").trim() || null, bio_en: String(data.get("bio_en") || "").trim() || null, profile_published: data.get("profile_published") === "on", active: data.get("active") === "on" };
    const client = createBrowserSupabase();
    const result = editing ? await client.from("publication_authors").update(payload).eq("id", editing.id).select().single() : await client.from("publication_authors").insert(payload).select().single();
    if (result.error) setMessage(lang === "uz" ? "Muallif saqlanmadi. Migratsiya va ruxsatlarni tekshiring." : "The writer was not saved. Check the migration and permissions.");
    else { const author = result.data as PublicationAuthor; onChange(editing ? authors.map((item) => item.id === author.id ? author : item) : [...authors, author].sort((a, b) => a.name.localeCompare(b.name))); setOpen(false); setEditing(null); }
    } catch { setMessage(lang === "uz" ? "Ulanishda xatolik. Qayta urinib ko‘ring." : "Connection failed. Please try again."); }
    finally { setBusy(false); }
  }

  return <section className="writer-manager">
    <div className="writer-manager-heading"><div><p className="cms-kicker">{lang === "uz" ? "Mualliflar ro‘yxati" : "Author directory"}</p><h3>{lang === "uz" ? "Doimiy mualliflar" : "Authors"}</h3><p>{lang === "uz" ? "Profilni tahrirlash uchun muallif kartasini tanlang." : "Select a writer card to edit the profile."}</p></div><button className="button button-primary" disabled={busy} onClick={() => { setMessage(""); setEditing(null); setOpen(true); }}><Plus size={16} />{lang === "uz" ? "Muallif qo‘shish" : "Add author"}</button></div>
    <div className="writer-chips">{authors.map((author) => <button key={author.id} className={author.active ? "active" : ""} disabled={busy} onClick={() => { setMessage(""); setEditing(author); setOpen(true); }}><span className="writer-avatar">{author.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</span><span><strong>{author.name}</strong><small>{(lang === "uz" ? author.role_uz : author.role_en) || (lang === "uz" ? "Muallif" : "Writer")}</small><em>{articles.filter((article) => article.author_id === author.id && article.status === "published").length} {lang === "uz" ? "ta nashr" : "publications"}</em></span><span className={`writer-state ${author.active ? "active" : ""}`}>{author.active ? (lang === "uz" ? "Faol" : "Active") : (lang === "uz" ? "Faol emas" : "Inactive")}</span><PenLine /></button>)}</div>
    {authors.length === 0 && <p>{lang === "uz" ? "Hali muallif qo‘shilmagan." : "No authors added yet."}</p>}
    {message && <p role="status" className="cms-message">{message}</p>}
    {open && <form key={editing?.id ?? "new-author"} className="writer-form" onSubmit={save}><fieldset disabled={busy} style={{ border: 0, padding: 0, margin: 0 }}><div className="writer-form-grid"><label>{lang === "uz" ? "To‘liq ism" : "Full name"}<input name="name" minLength={2} maxLength={100} required defaultValue={editing?.name ?? ""} /></label><label>{lang === "uz" ? "Lavozim (o‘zbekcha)" : "Role (Uzbek)"}<input name="role_uz" required defaultValue={editing?.role_uz ?? "Muallif"} /></label><label>{lang === "uz" ? "Lavozim (inglizcha)" : "Role (English)"}<input name="role_en" required defaultValue={editing?.role_en ?? "Writer"} /></label><label className="full-field">{lang === "uz" ? "Qisqa bio (o‘zbekcha, ixtiyoriy)" : "Short bio (Uzbek, optional)"}<textarea name="bio_uz" rows={2} defaultValue={editing?.bio_uz ?? ""} /></label><label className="full-field">{lang === "uz" ? "Qisqa bio (inglizcha, ixtiyoriy)" : "Short bio (English, optional)"}<textarea name="bio_en" rows={2} defaultValue={editing?.bio_en ?? ""} /></label><label className="consent"><input type="checkbox" name="active" defaultChecked={editing?.active ?? true} />{lang === "uz" ? "Maqolalarda tanlash mumkin" : "Available for articles"}</label><label className="consent"><input type="checkbox" name="profile_published" defaultChecked={editing?.profile_published ?? false} />{lang === "uz" ? "Ommaviy profilga tayyor" : "Ready for a public profile"}</label></div></fieldset><div className="cms-form-actions"><button disabled={busy} type="button" className="button button-secondary" onClick={() => setOpen(false)}>{lang === "uz" ? "Bekor qilish" : "Cancel"}</button><button className="button button-primary" disabled={busy}>{busy ? (lang === "uz" ? "Saqlanmoqda…" : "Saving…") : (lang === "uz" ? "Saqlash" : "Save author")}</button></div></form>}
    {open && editing && <section className="overview-panel" aria-label={lang === "uz" ? "Muallif hissasi" : "Author contributions"}>
      <h3>{lang === "uz" ? "Maqolalar va hissa" : "Articles and contributions"}</h3>
      <p>{(["published", "scheduled", "draft"] as const).map((status) => {
        const labels = { published: lang === "uz" ? "Nashrda" : "Published", scheduled: lang === "uz" ? "Rejalashtirilgan" : "Scheduled", draft: lang === "uz" ? "Qoralama" : "Drafts" };
        return <span key={status} style={{ marginInlineEnd: "1rem" }}>{labels[status]}: {articles.filter((article) => article.author_id === editing.id && article.status === status).length}</span>;
      })}</p>
      <div className="recent-content">{articles.filter((article) => article.author_id === editing.id).map((article) => <button type="button" key={article.id} disabled={busy || !onOpenArticle} onClick={() => onOpenArticle?.(article.id)}><span><strong>{(lang === "uz" ? article.title_uz : article.title_en) || article.title_uz || article.title_en}</strong></span><span className={`status-pill ${article.status}`}>{article.status === "published" ? (lang === "uz" ? "Nashrda" : "Published") : article.status === "scheduled" ? (lang === "uz" ? "Rejalashtirilgan" : "Scheduled") : (lang === "uz" ? "Qoralama" : "Draft")}</span></button>)}</div>
      {!articles.some((article) => article.author_id === editing.id) && <p>{lang === "uz" ? "Bu muallifga hali maqola biriktirilmagan." : "No articles assigned to this author yet."}</p>}
    </section>}
  </section>;
}
