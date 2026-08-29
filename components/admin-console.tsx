"use client";

import { FormEvent, useMemo, useState } from "react";
import { FilePenLine, GraduationCap, Newspaper, Plus, ShieldCheck, Trash2, Users } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { Lang } from "@/lib/site-content";

export type StaffRole = "owner" | "administrator" | "editor" | "writer";
export type AuditRecord = { id: number; actor_id: string | null; action: string; record_id: string | null; record_type: string | null; occurred_at: string };
export type AdminRecord = {
  id: string; type: "teacher" | "news" | "achievement"; slug: string; status: "draft" | "published";
  title_uz: string; title_en: string; summary_uz: string; summary_en: string; body_uz: string | null; body_en: string | null;
  category: string | null; department: string | null; event_date: string | null; recipient_uz: string | null; recipient_en: string | null;
  source_url: string | null; image_path: string | null; created_by: string;
};

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export function AdminConsole({ lang, initialRecords, initialAudit, role, currentUserId }: { lang: Lang; initialRecords: AdminRecord[]; initialAudit: AuditRecord[]; role: StaffRole; currentUserId: string }) {
  const [records, setRecords] = useState(initialRecords);
  const [type, setType] = useState<AdminRecord["type"]>("teacher");
  const [editing, setEditing] = useState<AdminRecord | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const visible = useMemo(() => records.filter((item) => item.type === type), [records, type]);
  const counts = (kind: AdminRecord["type"]) => ({ published: records.filter((item) => item.type === kind && item.status === "published").length, drafts: records.filter((item) => item.type === kind && item.status === "draft").length });
  const canPublish = role !== "writer";
  const canEdit = (record: AdminRecord) => role !== "writer" || (record.created_by === currentUserId && record.status === "draft");
  const canDelete = (record: AdminRecord) => role === "owner" || role === "administrator" || (role === "writer" && record.created_by === currentUserId && record.status === "draft");

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setMessage("");
    const formElement = event.currentTarget;
    const data = new FormData(formElement);
    const client = createBrowserSupabase();
    const image = data.get("image");
    let uploadedPath: string | null = null;

    if (image instanceof File && image.size > 0) {
      const allowed: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
      const extension = allowed[image.type];
      if (!extension || image.size > MAX_IMAGE_BYTES) {
        setBusy(false);
        setMessage(lang === "uz" ? "Rasm JPG, PNG yoki WebP formatida va 5 MB dan kichik bo‘lishi kerak." : "The image must be JPG, PNG or WebP and smaller than 5 MB.");
        return;
      }
      const { data: userData } = await client.auth.getUser();
      if (!userData.user) {
        setBusy(false); setMessage(lang === "uz" ? "Sessiya tugagan. Qayta kiring." : "Your session expired. Sign in again."); return;
      }
      uploadedPath = `${userData.user.id}/${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await client.storage.from("school-media").upload(uploadedPath, image, { cacheControl: "3600", contentType: image.type, upsert: false });
      if (uploadError) {
        setBusy(false); setMessage(friendlyError(uploadError, lang)); return;
      }
    }

    const removeImage = data.get("remove_image") === "on";
    const payload = {
      type,
      slug: String(data.get("slug")).trim().toLowerCase(),
      status: canPublish ? String(data.get("status")) : "draft",
      title_uz: String(data.get("title_uz")).trim(),
      title_en: String(data.get("title_en")).trim(),
      summary_uz: String(data.get("summary_uz")).trim(),
      summary_en: String(data.get("summary_en")).trim(),
      body_uz: String(data.get("body_uz") || "").trim(),
      body_en: String(data.get("body_en") || "").trim(),
      category: String(data.get("category") || "") || null,
      department: String(data.get("department") || "") || null,
      event_date: String(data.get("event_date") || "") || null,
      recipient_uz: String(data.get("recipient_uz") || "").trim() || null,
      recipient_en: String(data.get("recipient_en") || "").trim() || null,
      source_url: String(data.get("source_url") || "").trim() || null,
      image_path: uploadedPath ?? (removeImage ? null : editing?.image_path ?? null),
    };

    const result = editing
      ? await client.from("content_items").update(payload).eq("id", editing.id).select().single()
      : await client.from("content_items").insert(payload).select().single();
    if (result.error) {
      if (uploadedPath) await client.storage.from("school-media").remove([uploadedPath]);
      setBusy(false); setMessage(friendlyError(result.error, lang)); return;
    }

    const saved = result.data as AdminRecord;
    setRecords((current) => editing ? current.map((item) => item.id === saved.id ? saved : item) : [saved, ...current]);
    setEditing(null); formElement.reset(); setBusy(false);
    setMessage(lang === "uz" ? "Yozuv xavfsiz saqlandi." : "Record saved securely.");
  }

  async function remove(record: AdminRecord) {
    if (busy || !canDelete(record)) return;
    setBusy(true); setMessage("");
    const client = createBrowserSupabase();
    const { error } = await client.from("content_items").delete().eq("id", record.id);
    if (error) setMessage(friendlyError(error, lang));
    else {
      setRecords((current) => current.filter((item) => item.id !== record.id));
      if (editing?.id === record.id) setEditing(null);
      setMessage(lang === "uz" ? "Yozuv o‘chirildi." : "Record deleted.");
    }
    setBusy(false);
  }

  return <section className="cms-console">
    <div className="cms-summary">{(["teacher", "news", "achievement"] as const).map((kind) => { const Icon = kind === "teacher" ? Users : kind === "news" ? Newspaper : GraduationCap; const count = counts(kind); return <article key={kind}><Icon /><span>{kind === "teacher" ? (lang === "uz" ? "O‘qituvchilar" : "Teachers") : kind === "news" ? (lang === "uz" ? "Yangiliklar" : "News") : (lang === "uz" ? "Yutuqlar" : "Achievements")}</span><strong>{count.published} {lang === "uz" ? "nashrda" : "published"} · {count.drafts} {lang === "uz" ? "qoralama" : "drafts"}</strong></article>; })}</div>
    <div className="cms-tabs">{(["teacher", "news", "achievement"] as const).map((kind) => <button key={kind} className={`filter-chip ${type === kind ? "active" : ""}`} onClick={() => { setType(kind); setEditing(null); }}>{kind === "teacher" ? (lang === "uz" ? "O‘qituvchilar" : "Teachers") : kind === "news" ? (lang === "uz" ? "Yangiliklar" : "News") : (lang === "uz" ? "Yutuqlar" : "Achievements")}</button>)}</div>
    <div className="cms-layout"><div className="cms-list"><div className="cms-list-heading"><h2>{lang === "uz" ? "Yozuvlar" : "Records"}</h2><button className="button button-secondary" onClick={() => setEditing(null)}><Plus size={16} />{lang === "uz" ? "Yangi" : "New"}</button></div>
      {visible.length ? visible.map((record) => <article key={record.id}><div><span className={`status-pill ${record.status === "published" ? "published" : ""}`}>{record.status}</span><h3>{record.title_uz}</h3><small>/{record.slug}</small></div><div>
        {canEdit(record) && <button aria-label={lang === "uz" ? "Tahrirlash" : "Edit"} onClick={() => setEditing(record)}><FilePenLine /></button>}
        {canDelete(record) && <AlertDialog><AlertDialogTrigger asChild><button aria-label={lang === "uz" ? "O‘chirish" : "Delete"}><Trash2 /></button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{lang === "uz" ? "Yozuvni butunlay o‘chirasizmi?" : "Permanently delete this record?"}</AlertDialogTitle><AlertDialogDescription>{lang === "uz" ? "Bu amalni ortga qaytarib bo‘lmaydi. Avval qoralama yoki nashr holatini tekshiring." : "This action cannot be undone. Check the draft or publication state first."}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>{lang === "uz" ? "Bekor qilish" : "Cancel"}</AlertDialogCancel><AlertDialogAction variant="destructive" onClick={() => void remove(record)}>{lang === "uz" ? "O‘chirish" : "Delete"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>}
      </div></article>) : <p className="cms-empty">{lang === "uz" ? "Hali yozuv yo‘q." : "No records yet."}</p>}</div>
      <RecordForm key={editing?.id ?? `new-${type}`} lang={lang} type={type} record={editing} role={role} busy={busy} onSubmit={save} />
    </div>
    {message && <p className="cms-message" role="status">{message}</p>}
    <div className="admin-notice"><ShieldCheck /><span>{lang === "uz" ? "Ommaviy saytda faqat “published” holatidagi yozuvlar ko‘rinadi. Yozuvchi faqat o‘z qoralamalarini boshqaradi; nashr va o‘chirish vakolatlari rolga qarab cheklangan." : "Only published records appear publicly. Writers manage only their own drafts; publishing and deletion are restricted by role."}</span></div>
    {(role === "owner" || role === "administrator") && <section className="audit-panel"><h2>{lang === "uz" ? "So‘nggi faoliyat" : "Recent activity"}</h2>{initialAudit.length ? <div className="audit-list">{initialAudit.map((entry) => <div key={entry.id}><strong>{entry.action}</strong><span>{entry.record_type ?? "record"} · {new Date(entry.occurred_at).toLocaleString(lang === "uz" ? "uz-UZ" : "en-GB")}</span><small>{entry.actor_id ?? "system"}</small></div>)}</div> : <p>{lang === "uz" ? "Hali qayd etilgan o‘zgarish yo‘q." : "No recorded changes yet."}</p>}</section>}
  </section>;
}

function RecordForm({ lang, type, record, role, busy, onSubmit }: { lang: Lang; type: AdminRecord["type"]; record: AdminRecord | null; role: StaffRole; busy: boolean; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  const canPublish = role !== "writer";
  return <form className="cms-form" onSubmit={onSubmit}>
    <h2>{record ? (lang === "uz" ? "Tahrirlash" : "Edit record") : (lang === "uz" ? "Yangi yozuv" : "New record")}</h2>
    <div className="editor-grid">
      <label>Slug<input name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" defaultValue={record?.slug} /></label>
      {canPublish ? <label>{lang === "uz" ? "Holat" : "Status"}<select name="status" defaultValue={record?.status ?? "draft"}><option value="draft">Draft</option><option value="published">Published</option></select></label> : <><input type="hidden" name="status" value="draft" /><p className="role-note">{lang === "uz" ? "Yozuvchi yozuvlarni faqat qoralama sifatida saqlaydi." : "Writers can save records only as drafts."}</p></>}
      <label>{lang === "uz" ? "Sarlavha / ism (o‘zbekcha)" : "Title / name (Uzbek)"}<input name="title_uz" required defaultValue={record?.title_uz} /></label>
      <label>{lang === "uz" ? "Sarlavha / ism (inglizcha)" : "Title / name (English)"}<input name="title_en" required defaultValue={record?.title_en} /></label>
      <label className="full-field">{lang === "uz" ? "Qisqa mazmun (o‘zbekcha)" : "Summary (Uzbek)"}<textarea name="summary_uz" required rows={3} defaultValue={record?.summary_uz} /></label>
      <label className="full-field">{lang === "uz" ? "Qisqa mazmun (inglizcha)" : "Summary (English)"}<textarea name="summary_en" required rows={3} defaultValue={record?.summary_en} /></label>
      <label className="full-field">{lang === "uz" ? "Asosiy matn (o‘zbekcha)" : "Body (Uzbek)"}<textarea name="body_uz" rows={5} defaultValue={record?.body_uz ?? ""} /></label>
      <label className="full-field">{lang === "uz" ? "Asosiy matn (inglizcha)" : "Body (English)"}<textarea name="body_en" rows={5} defaultValue={record?.body_en ?? ""} /></label>
      {type === "teacher" && <><label>{lang === "uz" ? "Lavozim (o‘zbekcha)" : "Role (Uzbek)"}<input name="recipient_uz" defaultValue={record?.recipient_uz ?? ""} /></label><label>{lang === "uz" ? "Lavozim (inglizcha)" : "Role (English)"}<input name="recipient_en" defaultValue={record?.recipient_en ?? ""} /></label><label>{lang === "uz" ? "Bo‘lim" : "Department"}<select name="department" defaultValue={record?.department ?? "stem"}><option value="leadership">Leadership</option><option value="stem">STEM</option><option value="languages">Languages</option><option value="social-sciences">Social sciences</option></select></label></>}
      {type !== "teacher" && <label>{lang === "uz" ? "Sana" : "Date"}<input name="event_date" type="date" defaultValue={record?.event_date ?? ""} /></label>}
      {type === "news" && <label>{lang === "uz" ? "Tur" : "Category"}<select name="category" defaultValue={record?.category ?? "news"}><option value="news">News</option><option value="announcement">Announcement</option></select></label>}
      {type === "achievement" && <><label>{lang === "uz" ? "Qabul qiluvchi (o‘zbekcha)" : "Recipient (Uzbek)"}<input name="recipient_uz" defaultValue={record?.recipient_uz ?? ""} /></label><label>{lang === "uz" ? "Qabul qiluvchi (inglizcha)" : "Recipient (English)"}<input name="recipient_en" defaultValue={record?.recipient_en ?? ""} /></label><label className="full-field">{lang === "uz" ? "Tasdiqlash manbasi (HTTPS)" : "Verification source (HTTPS)"}<input name="source_url" type="url" pattern="https://.*" defaultValue={record?.source_url ?? ""} /></label></>}
      <label className="full-field">{lang === "uz" ? "Tasdiqlangan rasm (JPG, PNG yoki WebP; 5 MB gacha)" : "Approved image (JPG, PNG or WebP; up to 5 MB)"}<input name="image" type="file" accept="image/jpeg,image/png,image/webp" /></label>
      {record?.image_path && <label className="full-field consent cms-remove-image"><input name="remove_image" type="checkbox" />{lang === "uz" ? "Joriy rasmni yozuvdan olib tashlash" : "Remove the current image from this record"}</label>}
      <button className="button button-primary full-field" type="submit" disabled={busy}>{busy ? (lang === "uz" ? "Saqlanmoqda…" : "Saving…") : (lang === "uz" ? "Saqlash" : "Save record")}</button>
    </div>
  </form>;
}

function friendlyError(error: { code?: string; message?: string }, lang: Lang) {
  if (error.code === "23505") return lang === "uz" ? "Bu turdagi yozuv uchun ushbu slug allaqachon ishlatilgan." : "That slug is already used for this content type.";
  if (error.code === "23514") return lang === "uz" ? "Nashr qilish uchun majburiy ikki tilli maydonlar, sana va tasdiqlash ma’lumotlarini to‘ldiring." : "Complete the required bilingual fields, date and verification information before publishing.";
  if (error.code === "42501") return lang === "uz" ? "Bu amal sizning rolingiz yoki MFA holatingiz uchun ruxsat etilmagan." : "Your role or MFA status does not permit this action.";
  return lang === "uz" ? "Amal bajarilmadi. Qayta urinib ko‘ring yoki tizim egasiga xabar bering." : "The action could not be completed. Try again or notify the system owner.";
}
