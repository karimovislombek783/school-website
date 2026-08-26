"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Award, CalendarDays, Newspaper, Users } from "lucide-react";
import {
  AchievementRecord,
  copy,
  Lang,
  NewsRecord,
  TeacherRecord,
} from "@/lib/site-content";

export function TeacherDirectory({ lang, items }: { lang: Lang; items: TeacherRecord[] }) {
  const [department, setDepartment] = useState("all");
  const filters = [
    ["all", lang === "uz" ? "Barchasi" : "All"],
    ["stem", "STEM"],
    ["languages", lang === "uz" ? "Tillar" : "Languages"],
    ["leadership", lang === "uz" ? "Rahbariyat" : "Leadership"],
  ];
  const visible = useMemo(
    () => department === "all" ? items : items.filter((item) => item.department === department),
    [department, items],
  );

  return (
    <>
      <div className="directory-toolbar" aria-label={lang === "uz" ? "Bo‘lim bo‘yicha filtrlash" : "Filter by department"}>
        <span>{lang === "uz" ? "Bo‘lim:" : "Department:"}</span>
        {filters.map(([value, label]) => (
          <button key={value} type="button" className={`filter-chip ${department === value ? "active" : ""}`} aria-pressed={department === value} onClick={() => setDepartment(value)}>{label}</button>
        ))}
      </div>
      {visible.length ? (
        <div className="teacher-grid">
          {visible.map((teacher) => (
            <Link className="teacher-card teacher-link" href={`/${lang}/teachers/${teacher.slug}`} key={teacher.slug}>
              <div className="teacher-avatar">{teacher.initials}</div>
              <span>{departmentLabel(teacher.department, lang)}</span>
              <h2>{teacher.name[lang]}</h2>
              <p>{teacher.role[lang]}</p>
              <small>{lang === "uz" ? "Profilni ko‘rish" : "View profile"} <ArrowRight size={14} /></small>
            </Link>
          ))}
        </div>
      ) : <EmptyState lang={lang} kind="teachers" filtered={items.length > 0} />}
    </>
  );
}

export function NewsDirectory({ lang, items, limit }: { lang: Lang; items: NewsRecord[]; limit?: number }) {
  const [category, setCategory] = useState("all");
  const visible = items.filter((item) => category === "all" || item.category === category).slice(0, limit);
  return (
    <>
      {!limit && <div className="directory-toolbar">
        {[["all", lang === "uz" ? "Barchasi" : "All"], ["news", lang === "uz" ? "Yangiliklar" : "News"], ["announcement", lang === "uz" ? "E’lonlar" : "Announcements"]].map(([value, label]) => (
          <button key={value} type="button" className={`filter-chip ${category === value ? "active" : ""}`} aria-pressed={category === value} onClick={() => setCategory(value)}>{label}</button>
        ))}
      </div>}
      {visible.length ? <div className="news-grid">{visible.map((item) => (
        <article className="news-card" key={item.slug}>
          <div className="news-art"><Newspaper size={38} /></div>
          <div className="news-body"><div className="news-meta"><span>{item.category === "announcement" ? (lang === "uz" ? "E’lon" : "Announcement") : copy[lang].nav.news}</span><time>{item.date}</time></div><h3>{item.title[lang]}</h3><p>{item.excerpt[lang]}</p><Link className="text-link" href={`/${lang}/news/${item.slug}`}>{copy[lang].sections.learnMore}<ArrowRight size={16} /></Link></div>
        </article>
      ))}</div> : <EmptyState lang={lang} kind="news" filtered={items.length > 0} />}
    </>
  );
}

export function AchievementDirectory({ lang, items }: { lang: Lang; items: AchievementRecord[] }) {
  return items.length ? <div className="news-grid">{items.map((item) => (
    <article className="news-card" key={item.slug}><div className="news-art"><Award size={38} /></div><div className="news-body"><div className="news-meta"><span>{lang === "uz" ? "Tasdiqlangan yutuq" : "Verified achievement"}</span><time>{item.date}</time></div><h3>{item.title[lang]}</h3><p>{item.summary[lang]}</p><Link className="text-link" href={`/${lang}/achievements/${item.slug}`}>{copy[lang].sections.learnMore}<ArrowRight size={16} /></Link></div></article>
  ))}</div> : <EmptyState lang={lang} kind="achievements" />;
}

function EmptyState({ lang, kind, filtered = false }: { lang: Lang; kind: "teachers" | "news" | "achievements"; filtered?: boolean }) {
  const Icon = kind === "teachers" ? Users : kind === "news" ? CalendarDays : Award;
  const text = filtered
    ? (lang === "uz" ? "Bu bo‘limda hali nashr etilgan ma’lumot yo‘q." : "There is no published information in this category yet.")
    : kind === "teachers"
      ? (lang === "uz" ? "Tasdiqlangan o‘qituvchi profillari tez orada qo‘shiladi." : "Approved teacher profiles will be added soon.")
      : kind === "news"
        ? (lang === "uz" ? "Hozircha nashr etilgan yangiliklar yo‘q." : "There are no published news items yet.")
        : (lang === "uz" ? "Tasdiqlangan yutuqlar tez orada qo‘shiladi." : "Verified achievements will be added soon.");
  return <div className="public-empty"><Icon size={34} /><h3>{text}</h3><p>{lang === "uz" ? "Faqat maktab tasdiqlagan va nashr etilgan ma’lumotlar bu yerda ko‘rinadi." : "Only school-approved records marked as published appear here."}</p></div>;
}

function departmentLabel(value: TeacherRecord["department"], lang: Lang) {
  const labels = { leadership: { uz: "Rahbariyat", en: "Leadership" }, stem: { uz: "Aniq fanlar", en: "STEM" }, languages: { uz: "Tillar", en: "Languages" }, "social-sciences": { uz: "Ijtimoiy fanlar", en: "Social sciences" } };
  return labels[value][lang];
}
