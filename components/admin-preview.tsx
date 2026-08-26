"use client";

import { useState } from "react";
import { FileText, GraduationCap, LayoutDashboard, Newspaper, Save, ShieldCheck, Users, type LucideIcon } from "lucide-react";
import { Lang } from "@/lib/site-content";

const labels = {
  uz: { title: "Boshqaruv paneli namunasi", note: "Bu interfeys ish jarayonini ko‘rsatadi. Jonli ma’lumotlar bazasi va autentifikatsiya maktab tasdig‘idan keyin ulanadi.", dashboard: "Umumiy", teachers: "O‘qituvchilar", news: "Yangiliklar", achievements: "Yutuqlar", settings: "Maktab ma’lumoti", save: "O‘zgarishlarni saqlash", saved: "Namuna saqlandi", draft: "Qoralama", published: "Nashr etilgan" },
  en: { title: "Admin dashboard preview", note: "This interface demonstrates the workflow. Live database and authentication will be connected after school approval.", dashboard: "Overview", teachers: "Teachers", news: "News", achievements: "Achievements", settings: "School information", save: "Save changes", saved: "Preview saved", draft: "Draft", published: "Published" },
};

export function AdminPreview({ lang }: { lang: Lang }) {
  const [tab, setTab] = useState("dashboard");
  const [saved, setSaved] = useState(false);
  const t = labels[lang];
  const tabs = [
    ["dashboard", t.dashboard, LayoutDashboard], ["teachers", t.teachers, Users], ["news", t.news, Newspaper],
    ["achievements", t.achievements, GraduationCap], ["settings", t.settings, ShieldCheck],
  ] as const;
  return (
    <section className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-logo"><span className="brand-mark">M</span><div><strong>{t.title}</strong><small>Development only</small></div></div>
        <nav>{tabs.map(([id, label, Icon]) => <button key={id} className={tab === id ? "active" : ""} onClick={() => { setTab(id); setSaved(false); }}><Icon size={18} />{label}</button>)}</nav>
      </aside>
      <div className="admin-main">
        <div className="admin-notice"><ShieldCheck size={20} /><span>{t.note}</span></div>
        <div className="admin-heading"><div><p className="eyebrow">Website CMS</p><h2>{tabs.find(([id]) => id === tab)?.[1]}</h2></div><button className="button button-primary" onClick={() => setSaved(true)}><Save size={17} />{saved ? t.saved : t.save}</button></div>
        {tab === "dashboard" ? <AdminOverview lang={lang} /> : <AdminEditor lang={lang} tab={tab} />}
      </div>
    </section>
  );
}

function AdminOverview({ lang }: { lang: Lang }) {
  const cards: Array<[string, string, LucideIcon]> = lang === "uz"
    ? [["O‘qituvchilar", "0 tasdiqlangan", Users], ["Yangiliklar", "3 namuna", Newspaper], ["Yutuqlar", "0 tasdiqlangan", GraduationCap], ["Huquqiy ma’lumot", "Kutilmoqda", ShieldCheck]]
    : [["Teachers", "0 verified", Users], ["News", "3 samples", Newspaper], ["Achievements", "0 verified", GraduationCap], ["Legal information", "Pending", ShieldCheck]];
  return <div className="admin-stats">{cards.map(([title, value, Icon]) => <article key={String(title)}><Icon size={22} /><span>{title}</span><strong>{value}</strong></article>)}</div>;
}

function AdminEditor({ lang, tab }: { lang: Lang; tab: string }) {
  const [publicationStatus, setPublicationStatus] = useState<"draft" | "published">("draft");
  const title = tab === "teachers" ? (lang === "uz" ? "O‘qituvchi ma’lumoti" : "Teacher information") : tab === "news" ? (lang === "uz" ? "Yangilik qoralamasi" : "News draft") : tab === "achievements" ? (lang === "uz" ? "Yutuq ma’lumoti" : "Achievement information") : (lang === "uz" ? "Asosiy maktab ma’lumoti" : "Core school information");
  return (
    <div className="editor-card">
      <div className="editor-card-title"><FileText size={20} /><h3>{title}</h3><span className={`status-pill ${publicationStatus === "published" ? "published" : ""}`}>{publicationStatus === "draft" ? (lang === "uz" ? "Qoralama" : "Draft") : (lang === "uz" ? "Nashr etiladi" : "Published")}</span></div>
      <div className="editor-grid">
        <label>{lang === "uz" ? "Sarlavha / ism (o‘zbekcha)" : "Title / name (Uzbek)"}<input placeholder="[Tasdiqlangan ma’lumot]" /></label>
        <label>{lang === "uz" ? "Sarlavha / ism (inglizcha)" : "Title / name (English)"}<input placeholder="[Verified information]" /></label>
        <label className="full-field">{lang === "uz" ? "Tavsif (o‘zbekcha)" : "Description (Uzbek)"}<textarea rows={5} /></label>
        <label className="full-field">{lang === "uz" ? "Tavsif (inglizcha)" : "Description (English)"}<textarea rows={5} /></label>
        <label>{lang === "uz" ? "Ko‘rinish holati" : "Visibility status"}<select value={publicationStatus} onChange={(event) => setPublicationStatus(event.target.value as "draft" | "published")}><option value="draft">{lang === "uz" ? "Qoralama — ommaga ko‘rinmaydi" : "Draft — hidden from the public"}</option><option value="published">{lang === "uz" ? "Nashr etilgan — ommaga ko‘rinadi" : "Published — visible publicly"}</option></select></label>
        <p className="publication-note">{lang === "uz" ? "Faqat tasdiqlangan va “Nashr etilgan” holatidagi yozuvlar ommaviy saytda paydo bo‘ladi." : "Only approved records explicitly marked Published appear on the public website."}</p>
      </div>
    </div>
  );
}
