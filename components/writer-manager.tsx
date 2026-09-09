"use client";

import { FormEvent, useState } from "react";
import { PenLine, Plus } from "lucide-react";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { Lang } from "@/lib/site-content";

export type PublicationAuthor = { id: string; name: string; role_uz: string; role_en: string; bio_uz: string | null; bio_en: string | null; profile_published: boolean; active: boolean };

export function WriterManager({ lang, authors, onChange, articleCounts = {} }: { lang: Lang; authors: PublicationAuthor[]; onChange: (authors: PublicationAuthor[]) => void; articleCounts?: Record<string, number> }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PublicationAuthor | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage("");
    const data = new FormData(event.currentTarget);
    const payload = { name: String(data.get("name") || "").trim(), role_uz: String(data.get("role_uz") || "Muallif").trim(), role_en: String(data.get("role_en") || "Writer").trim(), bio_uz: String(data.get("bio_uz") || "").trim() || null, bio_en: String(data.get("bio_en") || "").trim() || null, profile_published: data.get("profile_published") === "on", active: data.get("active") === "on" };
    const client = createBrowserSupabase();
    const result = editing ? await client.from("publication_authors").update(payload).eq("id", editing.id).select().single() : await client.from("publication_authors").insert(payload).select().single();
    if (result.error) setMessage(lang === "uz" ? "Muallif saqlanmadi. Migratsiya va ruxsatlarni tekshiring." : "The writer was not saved. Check the migration and permissions.");
    else { const author = result.data as PublicationAuthor; onChange(editing ? authors.map((item) => item.id === author.id ? author : item) : [...authors, author].sort((a, b) => a.name.localeCompare(b.name))); setOpen(false); setEditing(null); }
    setBusy(false);
  }

  return <section className="writer-manager">
    <div className="writer-manager-heading"><div><p className="cms-kicker">{lang === "uz" ? "Mualliflar ro‘yxati" : "Writer directory"}</p><h3>{lang === "uz" ? "Doimiy mualliflar" : "Recurring writers"}</h3><p>{lang === "uz" ? "Profilni tahrirlash uchun muallif kartasini tanlang." : "Select a writer card to edit the profile."}</p></div><button className="button button-primary" onClick={() => { setEditing(null); setOpen(true); }}><Plus size={16} />{lang === "uz" ? "Muallif qo‘shish" : "Add writer"}</button></div>
    <div className="writer-chips">{authors.map((author) => <button key={author.id} className={author.active ? "active" : ""} onClick={() => { setEditing(author); setOpen(true); }}><span className="writer-avatar">{author.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</span><span><strong>{author.name}</strong><small>{author.role_uz || author.role_en || (lang === "uz" ? "Muallif" : "Writer")}</small><em>{articleCounts[author.id] ?? 0} {lang === "uz" ? "ta nashr" : "publications"}</em></span><span className={`writer-state ${author.active ? "active" : ""}`}>{author.active ? (lang === "uz" ? "Faol" : "Active") : (lang === "uz" ? "Yashirin" : "Hidden")}</span><PenLine /></button>)}</div>
    {message && <p className="cms-message">{message}</p>}
    {open && <form className="writer-form" onSubmit={save}><div className="writer-form-grid"><label>{lang === "uz" ? "To‘liq ism" : "Full name"}<input name="name" required defaultValue={editing?.name ?? ""} /></label><label>{lang === "uz" ? "Lavozim (o‘zbekcha)" : "Role (Uzbek)"}<input name="role_uz" required defaultValue={editing?.role_uz ?? "Muallif"} /></label><label>{lang === "uz" ? "Lavozim (inglizcha)" : "Role (English)"}<input name="role_en" required defaultValue={editing?.role_en ?? "Writer"} /></label><label className="full-field">{lang === "uz" ? "Qisqa bio (o‘zbekcha, ixtiyoriy)" : "Short bio (Uzbek, optional)"}<textarea name="bio_uz" rows={2} defaultValue={editing?.bio_uz ?? ""} /></label><label className="full-field">{lang === "uz" ? "Qisqa bio (inglizcha, ixtiyoriy)" : "Short bio (English, optional)"}<textarea name="bio_en" rows={2} defaultValue={editing?.bio_en ?? ""} /></label><label className="consent"><input type="checkbox" name="active" defaultChecked={editing?.active ?? true} />{lang === "uz" ? "Maqolalarda tanlash mumkin" : "Available for articles"}</label><label className="consent"><input type="checkbox" name="profile_published" defaultChecked={editing?.profile_published ?? false} />{lang === "uz" ? "Ommaviy profilga tayyor" : "Ready for a public profile"}</label></div><div className="cms-form-actions"><button type="button" className="button button-secondary" onClick={() => setOpen(false)}>{lang === "uz" ? "Bekor qilish" : "Cancel"}</button><button className="button button-primary" disabled={busy}>{lang === "uz" ? "Saqlash" : "Save writer"}</button></div></form>}
  </section>;
}
