"use client";

/* eslint-disable @next/next/no-img-element -- local object URLs preview images before upload. */

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, FilePenLine, GraduationCap, ImagePlus, Link2, Newspaper, Plus, ShieldCheck, Trash2, Users, X } from "lucide-react";
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
  category: string | null; departments: string[]; subjects_uz: string[]; subjects_en: string[]; is_leadership: boolean; event_date: string | null; recipient_uz: string | null; recipient_en: string | null;
  source_url: string | null; image_path: string | null; created_by: string;
  teacher_email: string | null; show_teacher_email: boolean; cv_url: string | null;
  related_links: Array<{ label_uz: string; label_en: string; url: string }>;
  gallery_paths: string[];
  achievement_category: "international" | "national" | "olympiad" | null;
  achievement_type: string | null; achievement_result: string | null;
  achievement_subject_uz: string | null; achievement_subject_en: string | null; academic_year: string | null;
};

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 2400;

async function normalizeImage(file: File): Promise<File> {
  if (file.size > MAX_IMAGE_BYTES) throw new Error("invalid-image");
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const isPng = bytes.length >= 8 && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((value, index) => bytes[index] === value);
  const isWebp = bytes.length >= 12 && new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" && new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP";
  if (!isJpeg && !isPng && !isWebp) throw new Error("invalid-image");

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d");
  if (!context) { bitmap.close(); throw new Error("invalid-image"); }
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.88));
  if (!blob || blob.size > MAX_IMAGE_BYTES) throw new Error("invalid-image");
  return new File([blob], "approved-image.webp", { type: "image/webp", lastModified: Date.now() });
}

export function AdminConsole({ lang, initialRecords, initialAudit, role, currentUserId }: { lang: Lang; initialRecords: AdminRecord[]; initialAudit: AuditRecord[]; role: StaffRole; currentUserId: string }) {
  const [records, setRecords] = useState(initialRecords);
  const [type, setType] = useState<AdminRecord["type"]>("teacher");
  const [editing, setEditing] = useState<AdminRecord | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
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
    const selectedImage = data.get("image");
    let image = selectedImage;
    let uploadedPath: string | null = null;
    const existingGalleryPaths = data.getAll("existing_gallery_path").map(String).slice(0, 8);
    const selectedGalleryFiles = data.getAll("gallery_images").filter((item): item is File => item instanceof File && item.size > 0);
    if (existingGalleryPaths.length + selectedGalleryFiles.length > 8) {
      setBusy(false); setMessage(lang === "uz" ? "Galereyada ko‘pi bilan 8 ta qo‘shimcha rasm bo‘lishi mumkin." : "A gallery can contain at most 8 additional images."); return;
    }
    let galleryImages: File[] = [];
    try { galleryImages = await Promise.all(selectedGalleryFiles.map(normalizeImage)); }
    catch {
      setBusy(false); setMessage(lang === "uz" ? "Barcha galereya fayllari haqiqiy JPG, PNG yoki WebP rasmi va 5 MB dan kichik bo‘lishi kerak." : "Every gallery file must be a genuine JPG, PNG or WebP image smaller than 5 MB."); return;
    }
    const uploadedGalleryPaths: string[] = [];

    if (selectedImage instanceof File && selectedImage.size > 0) {
      try {
        image = await normalizeImage(selectedImage);
      } catch {
        setBusy(false);
        setMessage(lang === "uz" ? "Fayl haqiqiy JPG, PNG yoki WebP rasmi bo‘lishi va 5 MB dan kichik bo‘lishi kerak." : "The file must be a genuine JPG, PNG or WebP image smaller than 5 MB.");
        return;
      }
    }

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

    if (galleryImages.length) {
      const { data: userData } = await client.auth.getUser();
      if (!userData.user) {
        if (uploadedPath) await client.storage.from("school-media").remove([uploadedPath]);
        setBusy(false); setMessage(lang === "uz" ? "Sessiya tugagan. Qayta kiring." : "Your session expired. Sign in again."); return;
      }
      for (const galleryImage of galleryImages) {
        const galleryPath = `${userData.user.id}/${crypto.randomUUID()}.webp`;
        const { error: galleryError } = await client.storage.from("school-media").upload(galleryPath, galleryImage, { cacheControl: "86400", contentType: "image/webp", upsert: false });
        if (galleryError) {
          await client.storage.from("school-media").remove([...(uploadedPath ? [uploadedPath] : []), ...uploadedGalleryPaths]);
          setBusy(false); setMessage(friendlyError(galleryError, lang)); return;
        }
        uploadedGalleryPaths.push(galleryPath);
      }
    }

    const removeImage = data.get("remove_image") === "on";
    const relatedLabelsUz = data.getAll("related_label_uz").map(String);
    const relatedLabelsEn = data.getAll("related_label_en").map(String);
    const relatedUrls = data.getAll("related_url").map(String);
    const relatedLinks = type === "teacher" ? relatedUrls.slice(0, 8).flatMap((url, index) => {
      const cleanUrl = url.trim();
      const labelUz = relatedLabelsUz[index]?.trim() ?? "";
      const labelEn = relatedLabelsEn[index]?.trim() ?? "";
      return cleanUrl && (labelUz || labelEn) ? [{ label_uz: labelUz || labelEn, label_en: labelEn || labelUz, url: cleanUrl }] : [];
    }) : [];
    const studentName = String(data.get("student_name") || "").trim();
    const achievementResult = String(data.get("achievement_result") || "").trim();
    const achievementType = String(data.get("achievement_type") || "").trim();
    const academicYear = String(data.get("academic_year") || "").trim();
    const generatedSlug = type === "achievement" && !editing
      ? uniqueAchievementSlug(studentName, achievementType, academicYear, records)
      : editing?.slug ?? String(data.get("slug") || "").trim().toLowerCase();
    const payload = {
      type,
      slug: generatedSlug,
      status: canPublish ? String(data.get("status")) : "draft",
      title_uz: type === "achievement" ? studentName : String(data.get("title_uz")).trim(),
      title_en: type === "achievement" ? studentName : String(data.get("title_en")).trim(),
      summary_uz: type === "achievement" ? achievementResult : String(data.get("summary_uz")).trim(),
      summary_en: type === "achievement" ? achievementResult : String(data.get("summary_en")).trim(),
      body_uz: String(data.get("body_uz") || "").trim(),
      body_en: String(data.get("body_en") || "").trim(),
      category: String(data.get("category") || "") || null,
      departments: type === "teacher" ? data.getAll("departments").map(String) : [],
      subjects_uz: type === "teacher" ? parseList(String(data.get("subjects_uz") || "")) : [],
      subjects_en: type === "teacher" ? parseList(String(data.get("subjects_en") || "")) : [],
      is_leadership: type === "teacher" && data.get("is_leadership") === "on",
      event_date: String(data.get("event_date") || "") || null,
      recipient_uz: type === "achievement" ? studentName : String(data.get("recipient_uz") || "").trim() || null,
      recipient_en: type === "achievement" ? studentName : String(data.get("recipient_en") || "").trim() || null,
      source_url: String(data.get("source_url") || "").trim() || null,
      teacher_email: type === "teacher" ? String(data.get("teacher_email") || "").trim() || null : null,
      show_teacher_email: type === "teacher" && data.get("show_teacher_email") === "on",
      cv_url: type === "teacher" ? String(data.get("cv_url") || "").trim() || null : null,
      related_links: relatedLinks,
      image_path: uploadedPath ?? (removeImage ? null : editing?.image_path ?? null),
      gallery_paths: type === "news" ? [...existingGalleryPaths, ...uploadedGalleryPaths] : [],
      achievement_category: type === "achievement" ? String(data.get("achievement_category") || "international") : null,
      achievement_type: type === "achievement" ? achievementType : null,
      achievement_result: type === "achievement" ? achievementResult : null,
      achievement_subject_uz: type === "achievement" ? String(data.get("achievement_subject_uz") || "").trim() || null : null,
      achievement_subject_en: type === "achievement" ? String(data.get("achievement_subject_en") || "").trim() || null : null,
      academic_year: type === "achievement" ? academicYear : null,
    };

    const result = editing
      ? await client.from("content_items").update(payload).eq("id", editing.id).select().single()
      : await client.from("content_items").insert(payload).select().single();
    if (result.error) {
      await client.storage.from("school-media").remove([...(uploadedPath ? [uploadedPath] : []), ...uploadedGalleryPaths]);
      setBusy(false); setMessage(friendlyError(result.error, lang)); return;
    }

    const saved = result.data as AdminRecord;
    setRecords((current) => editing ? current.map((item) => item.id === saved.id ? saved : item) : [saved, ...current]);
    setEditing(null); setEditorOpen(false); formElement.reset(); setBusy(false);
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
      if (editing?.id === record.id) { setEditing(null); setEditorOpen(false); }
      setMessage(lang === "uz" ? "Yozuv o‘chirildi." : "Record deleted.");
    }
    setBusy(false);
  }

  return <section className="cms-console">
    <div className="cms-summary">{(["teacher", "news", "achievement"] as const).map((kind) => { const Icon = kind === "teacher" ? Users : kind === "news" ? Newspaper : GraduationCap; const count = counts(kind); return <article key={kind}><Icon /><span>{typeLabel(kind, lang)}</span><strong>{count.published} {lang === "uz" ? "nashrda" : "published"} · {count.drafts} {lang === "uz" ? "qoralama" : "drafts"}</strong></article>; })}</div>
    <div className="cms-tabs">{(["teacher", "news", "achievement"] as const).map((kind) => <button key={kind} className={`filter-chip ${type === kind ? "active" : ""}`} onClick={() => { setType(kind); setEditing(null); setEditorOpen(false); }}>{kind === "teacher" ? (lang === "uz" ? "O‘qituvchilar" : "Teachers") : kind === "news" ? (lang === "uz" ? "Yangiliklar" : "News") : (lang === "uz" ? "Yutuq va sertifikatlar" : "Achievements & certificates")}</button>)}</div>
    <div className={`cms-layout ${editorOpen ? "editor-open" : ""}`}><div className="cms-list"><div className="cms-list-heading"><div><p className="cms-kicker">{typeLabel(type, lang)}</p><h2>{lang === "uz" ? "Barcha yozuvlar" : "All records"}</h2></div><button className="button button-primary" onClick={() => { setEditing(null); setEditorOpen(true); }}><Plus size={16} />{newLabel(type, lang)}</button></div>
      {visible.length ? visible.map((record) => <article key={record.id}><div><span className={`status-pill ${record.status === "published" ? "published" : ""}`}>{record.status === "published" ? (lang === "uz" ? "Nashrda" : "Published") : (lang === "uz" ? "Qoralama" : "Draft")}</span><h3>{record.title_uz}</h3><small>/{record.slug}</small></div><div>
        {canEdit(record) && <button aria-label={lang === "uz" ? "Tahrirlash" : "Edit"} onClick={() => { setEditing(record); setEditorOpen(true); }}><FilePenLine /></button>}
        {canDelete(record) && <AlertDialog><AlertDialogTrigger asChild><button aria-label={lang === "uz" ? "O‘chirish" : "Delete"}><Trash2 /></button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{lang === "uz" ? "Yozuvni butunlay o‘chirasizmi?" : "Permanently delete this record?"}</AlertDialogTitle><AlertDialogDescription>{lang === "uz" ? "Bu amalni ortga qaytarib bo‘lmaydi. Avval qoralama yoki nashr holatini tekshiring." : "This action cannot be undone. Check the draft or publication state first."}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>{lang === "uz" ? "Bekor qilish" : "Cancel"}</AlertDialogCancel><AlertDialogAction variant="destructive" onClick={() => void remove(record)}>{lang === "uz" ? "O‘chirish" : "Delete"}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>}
      </div></article>) : <div className="cms-empty"><Plus size={26} /><strong>{emptyLabel(type, lang)}</strong><span>{lang === "uz" ? "Birinchi ma’lumotni qo‘shish uchun yuqoridagi tugmani bosing." : "Use the button above when you are ready to add the first record."}</span></div>}</div>
      {editorOpen && <RecordForm key={editing?.id ?? `new-${type}`} lang={lang} type={type} record={editing} role={role} busy={busy} onSubmit={save} onCancel={() => { setEditing(null); setEditorOpen(false); }} />}
    </div>
    {message && <p className="cms-message" role="status">{message}</p>}
    <div className="admin-notice"><ShieldCheck /><span>{lang === "uz" ? "Ommaviy saytda faqat “Nashr qilingan” holatidagi yozuvlar ko‘rinadi. Yozuvchi faqat o‘z qoralamalarini boshqaradi; nashr va o‘chirish vakolatlari rolga qarab cheklangan." : "Only published records appear publicly. Writers manage only their own drafts; publishing and deletion are restricted by role."}</span></div>
    {(role === "owner" || role === "administrator") && <section className="audit-panel"><h2>{lang === "uz" ? "So‘nggi faoliyat" : "Recent activity"}</h2>{initialAudit.length ? <div className="audit-list">{initialAudit.map((entry) => <div key={entry.id}><strong>{auditAction(entry.action, lang)}</strong><span>{auditType(entry.record_type, lang)} · {new Date(entry.occurred_at).toLocaleString(lang === "uz" ? "uz-UZ" : "en-GB")}</span><small>{entry.actor_id ?? (lang === "uz" ? "tizim" : "system")}</small></div>)}</div> : <p>{lang === "uz" ? "Hali qayd etilgan o‘zgarish yo‘q." : "No recorded changes yet."}</p>}</section>}
  </section>;
}

function RecordForm({ lang, type, record, role, busy, onSubmit, onCancel }: { lang: Lang; type: AdminRecord["type"]; record: AdminRecord | null; role: StaffRole; busy: boolean; onSubmit: (event: FormEvent<HTMLFormElement>) => void; onCancel: () => void }) {
  const canPublish = role !== "writer";
  const [relatedLinks, setRelatedLinks] = useState(record?.related_links ?? []);
  const [achievementCategory, setAchievementCategory] = useState(record?.achievement_category ?? "international");
  return <form className="cms-form" onSubmit={onSubmit}>
    <div className="cms-form-heading"><div><p className="cms-kicker">{typeLabel(type, lang)}</p><h2>{record ? (lang === "uz" ? "Ma’lumotni tahrirlash" : "Edit record") : newLabel(type, lang)}</h2></div><button type="button" className="cms-close" onClick={onCancel} aria-label={lang === "uz" ? "Yopish" : "Close"}>×</button></div>
    <div className="editor-grid">
      {type !== "achievement" && <label>{lang === "uz" ? "URL nomi (slug)" : "URL slug"}<input name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" defaultValue={record?.slug} /></label>}
      {type === "achievement" && <p className="role-note full-field">{lang === "uz" ? "URL nomi o‘quvchi ismi, sertifikat turi va o‘quv yilidan avtomatik yaratiladi." : "The URL is generated automatically from the student name, certificate type and academic year."}</p>}
      {canPublish ? <label>{lang === "uz" ? "Nashr holati" : "Publication status"}<select name="status" defaultValue={record?.status ?? "draft"}><option value="draft">{lang === "uz" ? "Qoralama" : "Draft"}</option><option value="published">{lang === "uz" ? "Nashr qilingan" : "Published"}</option></select></label> : <><input type="hidden" name="status" value="draft" /><p className="role-note">{lang === "uz" ? "Yozuvchi yozuvlarni faqat qoralama sifatida saqlaydi." : "Writers can save records only as drafts."}</p></>}
      {type !== "achievement" && <>
        <label>{fieldLabel(type, "title", "uz", lang)}<input name="title_uz" required defaultValue={record?.title_uz} /></label>
        <label>{fieldLabel(type, "title", "en", lang)}<input name="title_en" required defaultValue={record?.title_en} /></label>
        <label className="full-field">{fieldLabel(type, "summary", "uz", lang)}<textarea name="summary_uz" required rows={3} defaultValue={record?.summary_uz} /></label>
        <label className="full-field">{fieldLabel(type, "summary", "en", lang)}<textarea name="summary_en" required rows={3} defaultValue={record?.summary_en} /></label>
        <label className="full-field">{fieldLabel(type, "body", "uz", lang)}<textarea name="body_uz" rows={5} defaultValue={record?.body_uz ?? ""} /></label>
        <label className="full-field">{fieldLabel(type, "body", "en", lang)}<textarea name="body_en" rows={5} defaultValue={record?.body_en ?? ""} /></label>
      </>}
      {type === "achievement" && <>
        <label className="full-field">{lang === "uz" ? "O‘quvchining to‘liq ismi" : "Student’s full name"}<input name="student_name" required defaultValue={record?.title_uz ?? ""} /></label>
        <label>{lang === "uz" ? "Asosiy yo‘nalish" : "Main category"}<select name="achievement_category" value={achievementCategory} onChange={(event) => setAchievementCategory(event.target.value as typeof achievementCategory)}><option value="international">{lang === "uz" ? "Xalqaro sertifikat" : "International certificate"}</option><option value="national">{lang === "uz" ? "Milliy sertifikat" : "National certificate"}</option><option value="olympiad">{lang === "uz" ? "Fan olimpiadasi" : "Subject olympiad"}</option></select></label>
        <label>{lang === "uz" ? (achievementCategory === "olympiad" ? "Olimpiada nomi" : "Sertifikat turi") : (achievementCategory === "olympiad" ? "Olympiad name" : "Certificate type")}<input name="achievement_type" required list="achievement-types" placeholder={achievementCategory === "international" ? "IELTS, SAT…" : achievementCategory === "national" ? "Milliy sertifikat" : "Olimpiada nomi"} defaultValue={record?.achievement_type ?? ""} /><datalist id="achievement-types"><option value="IELTS" /><option value="SAT" /><option value="Cambridge A-Level" /><option value="Cambridge AS-Level" /><option value="Milliy sertifikat" /></datalist></label>
        <label>{lang === "uz" ? "Natija" : "Result"}<input name="achievement_result" required placeholder={achievementCategory === "olympiad" ? (lang === "uz" ? "1-o‘rin, oltin medal…" : "1st place, gold medal…") : "8.5, 1450, C1, A+…"} defaultValue={record?.achievement_result ?? ""} /></label>
        <label>{lang === "uz" ? "O‘quv yili" : "Academic year"}<input name="academic_year" required pattern="[0-9]{4}(?:–|-)[0-9]{4}" placeholder="2025–2026" defaultValue={record?.academic_year ?? ""} /></label>
        <label>{lang === "uz" ? "Fan nomi (o‘zbekcha, ixtiyoriy)" : "Subject (Uzbek, optional)"}<input name="achievement_subject_uz" defaultValue={record?.achievement_subject_uz ?? ""} /></label>
        <label>{lang === "uz" ? "Fan nomi (inglizcha, ixtiyoriy)" : "Subject (English, optional)"}<input name="achievement_subject_en" defaultValue={record?.achievement_subject_en ?? ""} /></label>
        <label>{lang === "uz" ? "Sana (ixtiyoriy)" : "Date (optional)"}<input name="event_date" type="date" defaultValue={record?.event_date ?? ""} /></label>
        <label>{lang === "uz" ? "Tasdiqlash havolasi (ixtiyoriy, HTTPS)" : "Verification link (optional, HTTPS)"}<input name="source_url" type="url" pattern="https://.*" defaultValue={record?.source_url ?? ""} /></label>
      </>}
      {type === "teacher" && <>
        <label>{lang === "uz" ? "Lavozim (o‘zbekcha)" : "Role (Uzbek)"}<input name="recipient_uz" defaultValue={record?.recipient_uz ?? ""} /></label>
        <label>{lang === "uz" ? "Lavozim (inglizcha)" : "Role (English)"}<input name="recipient_en" defaultValue={record?.recipient_en ?? ""} /></label>
        <label className="full-field consent cms-check"><input name="is_leadership" type="checkbox" defaultChecked={record?.is_leadership ?? false} />{lang === "uz" ? "Rahbariyat a’zosi (direktor, direktor o‘rinbosari yoki boshqa rahbar)" : "Leadership member (director, deputy principal or another school leader)"}</label>
        <fieldset className="full-field cms-options"><legend>{lang === "uz" ? "Fan bo‘limlari (bir nechtasini tanlash mumkin)" : "Academic departments (select all that apply)"}</legend>{departmentOptions(lang).map(([value, label]) => <label key={value} className="consent"><input name="departments" type="checkbox" value={value} defaultChecked={record?.departments?.includes(value) ?? false} />{label}</label>)}</fieldset>
        <label className="full-field">{lang === "uz" ? "O‘qitadigan fanlar (o‘zbekcha, vergul yoki yangi qator bilan)" : "Subjects taught (Uzbek, separated by commas or new lines)"}<textarea name="subjects_uz" rows={3} defaultValue={record?.subjects_uz?.join(", ") ?? ""} /></label>
        <label className="full-field">{lang === "uz" ? "O‘qitadigan fanlar (inglizcha, vergul yoki yangi qator bilan)" : "Subjects taught (English, separated by commas or new lines)"}<textarea name="subjects_en" rows={3} defaultValue={record?.subjects_en?.join(", ") ?? ""} /></label>
        <label>{lang === "uz" ? "O‘qituvchi emaili (ixtiyoriy)" : "Teacher email (optional)"}<input name="teacher_email" type="email" autoComplete="off" defaultValue={record?.teacher_email ?? ""} /></label>
        <label>{lang === "uz" ? "CV yoki profil havolasi (HTTPS)" : "CV or profile link (HTTPS)"}<input name="cv_url" type="url" pattern="https://.*" placeholder="https://…" defaultValue={record?.cv_url ?? ""} /></label>
        <label className="full-field consent cms-check"><input name="show_teacher_email" type="checkbox" defaultChecked={record?.show_teacher_email ?? false} />{lang === "uz" ? "Emailni ommaviy profilda ko‘rsatish uchun o‘qituvchi roziligi olingan" : "Teacher consent has been obtained to show the email publicly"}</label>
        <fieldset className="full-field cms-related-editor"><legend>{lang === "uz" ? "Tegishli havolalar (8 tagacha)" : "Related links (up to 8)"}</legend>
          <p>{lang === "uz" ? "Instagram, Telegram, YouTube va boshqa mashhur xizmatlar logotipi URL bo‘yicha avtomatik tanlanadi." : "Instagram, Telegram, YouTube and other popular service icons are selected automatically from the URL."}</p>
          {relatedLinks.map((link, index) => <div className="cms-related-row" key={index}>
            <input name="related_label_uz" aria-label={lang === "uz" ? "Havola nomi o‘zbekcha" : "Link label in Uzbek"} placeholder={lang === "uz" ? "Nomi (o‘zbekcha)" : "Label (Uzbek)"} defaultValue={link.label_uz} />
            <input name="related_label_en" aria-label={lang === "uz" ? "Havola nomi inglizcha" : "Link label in English"} placeholder={lang === "uz" ? "Nomi (inglizcha)" : "Label (English)"} defaultValue={link.label_en} />
            <input name="related_url" aria-label="HTTPS URL" type="url" pattern="https://.*" placeholder="https://…" defaultValue={link.url} />
            <button type="button" aria-label={lang === "uz" ? "Havolani olib tashlash" : "Remove link"} onClick={() => setRelatedLinks((items) => items.filter((_, itemIndex) => itemIndex !== index))}><X size={17} /></button>
          </div>)}
          {relatedLinks.length < 8 && <button className="button button-secondary cms-add-link" type="button" onClick={() => setRelatedLinks((items) => [...items, { label_uz: "", label_en: "", url: "" }])}><Link2 size={16} />{lang === "uz" ? "Havola qo‘shish" : "Add link"}</button>}
        </fieldset>
      </>}
      {type === "news" && <label>{lang === "uz" ? "Sana" : "Date"}<input name="event_date" type="date" defaultValue={record?.event_date ?? ""} /></label>}
      {type === "news" && <label>{lang === "uz" ? "Tur" : "Category"}<select name="category" defaultValue={record?.category ?? "news"}><option value="news">{lang === "uz" ? "Yangilik" : "News"}</option><option value="announcement">{lang === "uz" ? "E’lon" : "Announcement"}</option></select></label>}
      <CoverImagePicker lang={lang} type={type} hasCurrentImage={Boolean(record?.image_path)} />
      {type === "news" && <GalleryEditor lang={lang} existingPaths={record?.gallery_paths ?? []} />}
      {record?.image_path && <label className="full-field consent cms-remove-image"><input name="remove_image" type="checkbox" />{lang === "uz" ? "Joriy rasmni yozuvdan olib tashlash" : "Remove the current image from this record"}</label>}
      <div className="cms-form-actions full-field"><button className="button button-secondary" type="button" onClick={onCancel}>{lang === "uz" ? "Bekor qilish" : "Cancel"}</button><button className="button button-primary" type="submit" disabled={busy}>{busy ? (lang === "uz" ? "Saqlanmoqda…" : "Saving…") : (lang === "uz" ? "Saqlash" : "Save record")}</button></div>
    </div>
  </form>;
}

function CoverImagePicker({ lang, type, hasCurrentImage }: { lang: Lang; type: AdminRecord["type"]; hasCurrentImage: boolean }) {
  const [file, setFile] = useState<File | null>(null);
  const previewUrl = useMemo(() => file ? URL.createObjectURL(file) : null, [file]);
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  return <div className="full-field cms-image-picker">
    <div><strong>{type === "achievement" ? (lang === "uz" ? "Sertifikat rasmi (ixtiyoriy)" : "Certificate image (optional)") : (lang === "uz" ? "Muqova rasmi" : "Cover image")}</strong><small>{type === "achievement" ? (lang === "uz" ? "Faqat ommaga chiqarishga tayyor nusxani yuklang. JPG, PNG yoki WebP; 5 MB gacha." : "Upload only the public-ready copy. JPG, PNG or WebP; up to 5 MB.") : (lang === "uz" ? "Yangilik kartasi va maqola tepasida ko‘rinadigan asosiy rasm. JPG, PNG yoki WebP; 5 MB gacha." : "The main image shown on the news card and at the top of the article. JPG, PNG or WebP; up to 5 MB.")}</small></div>
    <label className="cms-file-button"><ImagePlus size={18} /><span>{lang === "uz" ? "Rasmni tanlash" : "Choose image"}</span><input name="image" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setFile(event.target.files?.[0] ?? null)} /></label>
    {file && previewUrl ? <div className="cms-cover-preview"><img src={previewUrl} alt="" /><div><strong>{file.name}</strong><small>{lang === "uz" ? "Yangi muqova rasmi tanlandi" : "New cover image selected"}</small></div></div> : <p className="cms-file-status">{hasCurrentImage ? (lang === "uz" ? "Joriy muqova rasmi saqlangan. Yangi rasm tanlasangiz, u almashtiriladi." : "A current cover is saved. Choosing a new image will replace it.") : (lang === "uz" ? "Rasm tanlanmagan" : "No image selected")}</p>}
  </div>;
}

function GalleryEditor({ lang, existingPaths }: { lang: Lang; existingPaths: string[] }) {
  const [existing, setExisting] = useState(existingPaths.slice(0, 8));
  const [files, setFiles] = useState<File[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const previews = useMemo(() => files.map((file) => ({ file, url: URL.createObjectURL(file) })), [files]);
  useEffect(() => () => previews.forEach((item) => URL.revokeObjectURL(item.url)), [previews]);

  function syncFiles(next: File[]) {
    setFiles(next);
    if (inputRef.current) {
      const transfer = new DataTransfer();
      next.forEach((file) => transfer.items.add(file));
      inputRef.current.files = transfer.files;
    }
  }
  function move<T>(items: T[], index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= items.length) return items;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    return next;
  }
  const remaining = 8 - existing.length;
  return <fieldset className="full-field cms-gallery-editor"><legend>{lang === "uz" ? "Yangilik galereyasi (8 tagacha qo‘shimcha rasm)" : "News gallery (up to 8 additional images)"}</legend>
    <p>{lang === "uz" ? "Bu yerga faqat qo‘shimcha rasmlarni yuklang. Muqova rasmi yuqoridagi alohida maydonda tanlanadi." : "Upload supporting images here only. Choose the cover in the separate field above."}</p>
    {existing.map((path, index) => <div className="cms-existing-gallery" key={path}><input type="hidden" name="existing_gallery_path" value={path} /><span>{index + 1}. {path.split("/").pop()}</span><div><button type="button" disabled={index === 0} onClick={() => setExisting((items) => move(items, index, -1))} aria-label={lang === "uz" ? "Oldinga surish" : "Move earlier"}><ArrowLeft /></button><button type="button" disabled={index === existing.length - 1} onClick={() => setExisting((items) => move(items, index, 1))} aria-label={lang === "uz" ? "Orqaga surish" : "Move later"}><ArrowRight /></button><button type="button" onClick={() => setExisting((items) => items.filter((_, itemIndex) => itemIndex !== index))} aria-label={lang === "uz" ? "Rasmni olib tashlash" : "Remove image"}><Trash2 /></button></div></div>)}
    <label className={`cms-file-button ${remaining === 0 ? "disabled" : ""}`}><ImagePlus size={18} /><span>{lang === "uz" ? "Rasmlarni tanlash" : "Choose images"}</span><input ref={inputRef} name="gallery_images" type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={remaining === 0} onChange={(event) => syncFiles(Array.from(event.target.files ?? []).slice(0, remaining))} /></label>
    {previews.length > 0 && <div className="cms-gallery-previews">{previews.map((item, index) => <article key={`${item.file.name}-${item.file.lastModified}`}><img src={item.url} alt="" /><span>{existing.length + index + 1}. {item.file.name}</span><div><button type="button" disabled={index === 0} onClick={() => syncFiles(move(files, index, -1))} aria-label={lang === "uz" ? "Oldinga surish" : "Move earlier"}><ArrowLeft /></button><button type="button" disabled={index === files.length - 1} onClick={() => syncFiles(move(files, index, 1))} aria-label={lang === "uz" ? "Orqaga surish" : "Move later"}><ArrowRight /></button><button type="button" onClick={() => syncFiles(files.filter((_, itemIndex) => itemIndex !== index))} aria-label={lang === "uz" ? "Rasmni olib tashlash" : "Remove image"}><X /></button></div></article>)}</div>}
    <small><ImagePlus size={16} />{lang === "uz" ? `${existing.length + files.length}/8 ta rasm tanlandi` : `${existing.length + files.length}/8 images selected`}</small>
  </fieldset>;
}

function typeLabel(type: AdminRecord["type"], lang: Lang) {
  if (type === "teacher") return lang === "uz" ? "O‘qituvchilar" : "Teachers";
  if (type === "news") return lang === "uz" ? "Yangiliklar va e’lonlar" : "News & announcements";
  return lang === "uz" ? "Yutuq va sertifikatlar" : "Achievements & certificates";
}

function newLabel(type: AdminRecord["type"], lang: Lang) {
  if (type === "teacher") return lang === "uz" ? "O‘qituvchi qo‘shish" : "Add teacher";
  if (type === "news") return lang === "uz" ? "Yangilik yozish" : "Write news";
  return lang === "uz" ? "Yutuq qo‘shish" : "Add achievement";
}

function emptyLabel(type: AdminRecord["type"], lang: Lang) {
  if (type === "teacher") return lang === "uz" ? "Hali o‘qituvchi qo‘shilmagan" : "No teachers added yet";
  if (type === "news") return lang === "uz" ? "Hali yangilik yozilmagan" : "No news written yet";
  return lang === "uz" ? "Hali yutuq yoki sertifikat qo‘shilmagan" : "No achievements or certificates yet";
}

function fieldLabel(type: AdminRecord["type"], field: "title" | "summary" | "body", contentLang: "uz" | "en", uiLang: Lang) {
  const language = contentLang === "uz" ? (uiLang === "uz" ? "o‘zbekcha" : "Uzbek") : (uiLang === "uz" ? "inglizcha" : "English");
  const labels = type === "teacher"
    ? { title: uiLang === "uz" ? "To‘liq ism" : "Full name", summary: uiLang === "uz" ? "Qisqa tarjimai hol" : "Short biography", body: uiLang === "uz" ? "Batafsil tarjimai hol" : "Detailed biography" }
    : type === "news"
      ? { title: uiLang === "uz" ? "Sarlavha" : "Headline", summary: uiLang === "uz" ? "Qisqa mazmun" : "Short summary", body: uiLang === "uz" ? "Yangilik matni" : "Article body" }
      : { title: uiLang === "uz" ? "Yutuq nomi" : "Achievement title", summary: uiLang === "uz" ? "Qisqa tavsif" : "Short description", body: uiLang === "uz" ? "Batafsil ma’lumot" : "Detailed information" };
  return `${labels[field]} (${language})`;
}

function auditAction(action: string, lang: Lang) {
  const labels: Record<string, { uz: string; en: string }> = { insert: { uz: "Qo‘shildi", en: "Created" }, update: { uz: "Yangilandi", en: "Updated" }, delete: { uz: "O‘chirildi", en: "Deleted" } };
  return labels[action]?.[lang] ?? action;
}

function auditType(type: string | null, lang: Lang) {
  if (type === "teacher") return lang === "uz" ? "O‘qituvchi" : "Teacher";
  if (type === "news") return lang === "uz" ? "Yangilik" : "News";
  if (type === "achievement") return lang === "uz" ? "Yutuq" : "Achievement";
  return lang === "uz" ? "Yozuv" : "Record";
}

function parseList(value: string) { return value.split(/[,\n]/).map((item) => item.trim()).filter(Boolean); }

function uniqueAchievementSlug(studentName: string, achievementType: string, academicYear: string, records: AdminRecord[]) {
  const base = slugify(`${studentName}-${achievementType}-${academicYear}`) || `achievement-${crypto.randomUUID().slice(0, 8)}`;
  const used = new Set(records.filter((record) => record.type === "achievement").map((record) => record.slug));
  if (!used.has(base)) return base;
  let suffix = 2;
  while (used.has(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}

function slugify(value: string) {
  const cyrillic: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "j", з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "x", ҳ: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sh", ъ: "", ы: "i", ь: "", э: "e", ю: "yu", я: "ya", қ: "q", ғ: "g",
  };
  return value
    .toLocaleLowerCase("uz")
    .replace(/[а-яёқғҳ]/g, (letter) => cyrillic[letter] ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[ʻʼ‘’`']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 110)
    .replace(/-+$/g, "");
}

function departmentOptions(lang: Lang): Array<[string, string]> {
  return [
    ["stem", lang === "uz" ? "Aniq va tabiiy fanlar (STEM)" : "STEM"],
    ["languages", lang === "uz" ? "Tillar" : "Languages"],
    ["social-sciences", lang === "uz" ? "Ijtimoiy fanlar" : "Social sciences"],
    ["primary", lang === "uz" ? "Boshlang‘ich ta’lim" : "Primary education"],
    ["arts-pe", lang === "uz" ? "San’at va jismoniy tarbiya" : "Arts & physical education"],
    ["student-support", lang === "uz" ? "O‘quvchilarni qo‘llab-quvvatlash" : "Student support"],
  ];
}

function friendlyError(error: { code?: string; message?: string }, lang: Lang) {
  if (error.code === "23505") return lang === "uz" ? "Bu turdagi yozuv uchun ushbu slug allaqachon ishlatilgan." : "That slug is already used for this content type.";
  if (error.code === "23514") return lang === "uz" ? "Nashr qilish uchun majburiy ikki tilli maydonlar, sana va tasdiqlash ma’lumotlarini to‘ldiring." : "Complete the required bilingual fields, date and verification information before publishing.";
  if (error.code === "42501") return lang === "uz" ? "Bu amal sizning rolingiz yoki MFA holatingiz uchun ruxsat etilmagan." : "Your role or MFA status does not permit this action.";
  return lang === "uz" ? "Amal bajarilmadi. Qayta urinib ko‘ring yoki tizim egasiga xabar bering." : "The action could not be completed. Try again or notify the system owner.";
}
