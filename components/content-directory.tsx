/* eslint-disable @next/next/no-img-element -- Supabase returns short-lived signed image URLs. */
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Award, CalendarDays, CheckCircle2, Medal, Newspaper, Trophy, Users } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
    ["leadership", lang === "uz" ? "Rahbariyat" : "Leadership"],
    ["stem", "STEM"],
    ["languages", lang === "uz" ? "Tillar" : "Languages"],
    ["social-sciences", lang === "uz" ? "Ijtimoiy fanlar" : "Social sciences"],
    ["primary", lang === "uz" ? "Boshlang‘ich ta’lim" : "Primary education"],
    ["arts-pe", lang === "uz" ? "San’at va jismoniy tarbiya" : "Arts & physical education"],
    ["student-support", lang === "uz" ? "O‘quvchilarni qo‘llab-quvvatlash" : "Student support"],
  ];
  const visible = useMemo(
    () => department === "all" ? items : items.filter((item) => department === "leadership" ? item.isLeadership : item.departments.includes(department as TeacherRecord["departments"][number])),
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
              <div className="teacher-avatar">{teacher.imageUrl ? <img src={teacher.imageUrl} alt={lang === "uz" ? `${teacher.name[lang]}, ${teacher.role[lang]}` : `Portrait of ${teacher.name[lang]}, ${teacher.role[lang]}`} /> : teacher.initials}</div>
              <div className="teacher-tags">{teacher.isLeadership && <span>{lang === "uz" ? "Rahbariyat" : "Leadership"}</span>}{teacher.departments.map((item) => <span key={item}>{departmentLabel(item, lang)}</span>)}</div>
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
          <div className="news-art">{item.imageUrl ? <img src={item.imageUrl} alt={item.title[lang]} /> : <Newspaper size={38} aria-hidden="true" />}</div>
          <div className="news-body"><div className="news-meta"><span>{item.category === "announcement" ? (lang === "uz" ? "E’lon" : "Announcement") : copy[lang].nav.news}</span><time dateTime={item.date}>{item.date}</time></div><h3>{item.title[lang]}</h3><p>{item.excerpt[lang]}</p><Link className="text-link" href={`/${lang}/news/${item.slug}`}>{copy[lang].sections.learnMore}<ArrowRight size={16} /></Link></div>
        </article>
      ))}</div> : <EmptyState lang={lang} kind="news" filtered={items.length > 0} />}
    </>
  );
}

export function AchievementDirectory({ lang, items }: { lang: Lang; items: AchievementRecord[] }) {
  const [category, setCategory] = useState<AchievementRecord["category"]>("international");
  const [certificateType, setCertificateType] = useState("all");
  const [result, setResult] = useState("all");
  const [year, setYear] = useState("all");
  const international = items.filter((item) => item.category === "international");
  const unique = (values: string[]) => [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
  const types = unique(international.map((item) => item.credentialType));
  const results = unique(international.map((item) => item.result));
  const years = unique(international.map((item) => item.academicYear)).reverse();
  const visible = items.filter((item) => item.category === category && (category !== "international" || ((certificateType === "all" || item.credentialType === certificateType) && (result === "all" || item.result === result) && (year === "all" || item.academicYear === year))));
  const categories: Array<[AchievementRecord["category"], string]> = [
    ["international", lang === "uz" ? "Xalqaro sertifikatlar" : "International certificates"],
    ["national", lang === "uz" ? "Milliy sertifikatlar" : "National certificates"],
    ["olympiad", lang === "uz" ? "Fan olimpiadalari" : "Subject olympiads"],
  ];

  if (!items.length) return <EmptyState lang={lang} kind="achievements" />;
  return <div className="achievement-directory">
    <div className="achievement-tabs" role="tablist" aria-label={lang === "uz" ? "Yutuq yo‘nalishi" : "Achievement category"}>{categories.map(([value, label]) => <button key={value} type="button" role="tab" aria-selected={category === value} className={category === value ? "active" : ""} onClick={() => { setCategory(value); setCertificateType("all"); setResult("all"); setYear("all"); }}>{label}<span>{items.filter((item) => item.category === value).length}</span></button>)}</div>
    {category === "international" && international.length > 0 && <div className="achievement-filters" aria-label={lang === "uz" ? "Xalqaro sertifikatlarni filtrlash" : "Filter international certificates"}>
      <label>{lang === "uz" ? "Sertifikat turi" : "Certificate type"}<select value={certificateType} onChange={(event) => setCertificateType(event.target.value)}><option value="all">{lang === "uz" ? "Barchasi" : "All"}</option>{types.map((value) => <option key={value}>{value}</option>)}</select></label>
      <label>{lang === "uz" ? "Natija" : "Result"}<select value={result} onChange={(event) => setResult(event.target.value)}><option value="all">{lang === "uz" ? "Barchasi" : "All"}</option>{results.map((value) => <option key={value}>{value}</option>)}</select></label>
      <label>{lang === "uz" ? "Olingan yil" : "Year obtained"}<select value={year} onChange={(event) => setYear(event.target.value)}><option value="all">{lang === "uz" ? "Barcha yillar" : "All years"}</option>{years.map((value) => <option key={value}>{value}</option>)}</select></label>
    </div>}
    {visible.length ? <div className="achievement-grid">{visible.map((item) => <AchievementCard key={item.slug} lang={lang} item={item} />)}</div> : <div className="achievement-empty"><Award /><strong>{lang === "uz" ? "Bu bo‘limda hozircha natija yo‘q" : "There are no results in this section yet"}</strong></div>}
  </div>;
}

function AchievementCard({ lang, item }: { lang: Lang; item: AchievementRecord }) {
  const Icon = item.category === "olympiad" ? Trophy : item.category === "national" ? Medal : Award;
  const categoryLabel = item.category === "international" ? (lang === "uz" ? "Xalqaro" : "International") : item.category === "national" ? (lang === "uz" ? "Milliy" : "National") : (lang === "uz" ? "Olimpiada" : "Olympiad");
  return <Dialog><article className={`achievement-card achievement-${item.category}`}>
    <div className="achievement-card-top"><span className="achievement-verified"><CheckCircle2 />{lang === "uz" ? "Tasdiqlangan natija" : "Verified result"}</span><span className="achievement-kind">{item.credentialType}</span></div>
    <div className="achievement-score"><Icon aria-hidden="true" /><small>{lang === "uz" ? "Natija" : "Result"}</small><strong>{item.result}</strong></div>
    <div className="achievement-card-body"><span>{categoryLabel}</span><h2>{item.studentName}</h2>{item.subject[lang] && <p>{item.subject[lang]}</p>}<time>{item.academicYear}</time>
      <DialogTrigger asChild><button type="button" className="achievement-open">{lang === "uz" ? "Batafsil ko‘rish" : "View details"}<ArrowRight /></button></DialogTrigger>
    </div>
  </article><DialogContent className="achievement-dialog"><DialogHeader><div className="achievement-dialog-meta"><span>{item.credentialType}</span><strong>{item.result}</strong></div><DialogTitle>{item.studentName}</DialogTitle><DialogDescription>{categoryLabel} · {item.academicYear}</DialogDescription></DialogHeader>
    <dl className="achievement-details"><div><dt>{lang === "uz" ? "Natija" : "Result"}</dt><dd>{item.result}</dd></div>{item.subject[lang] && <div><dt>{lang === "uz" ? "Fan" : "Subject"}</dt><dd>{item.subject[lang]}</dd></div>}<div><dt>{lang === "uz" ? "O‘quv yili" : "Academic year"}</dt><dd>{item.academicYear}</dd></div></dl>
    {item.imageUrl && <div className="achievement-document"><img src={item.imageUrl} alt={lang === "uz" ? `${item.studentName} uchun tahrirlangan sertifikat nusxasi` : `Redacted certificate copy for ${item.studentName}`} /></div>}
    <div className="achievement-confirmation"><CheckCircle2 /><span>{lang === "uz" ? "Natija maktab tomonidan tekshirilgan va tasdiqlangan." : "This result has been reviewed and verified by the school."}</span></div>
    {item.source && <a className="text-link" href={item.source} target="_blank" rel="noreferrer">{lang === "uz" ? "Tasdiqlash manbasini ochish" : "Open verification source"}<ArrowRight /></a>}
  </DialogContent></Dialog>;
}

function EmptyState({ lang, kind, filtered = false }: { lang: Lang; kind: "teachers" | "news" | "achievements"; filtered?: boolean }) {
  const Icon = kind === "teachers" ? Users : kind === "news" ? CalendarDays : Award;
  const text = filtered
    ? (lang === "uz" ? "Bu bo‘limda hali nashr etilgan ma’lumot yo‘q." : "There is no published information in this category yet.")
    : kind === "teachers"
      ? (lang === "uz" ? "Tasdiqlangan o‘qituvchi profillari tez orada qo‘shiladi." : "Approved teacher profiles will be added soon.")
      : kind === "news"
        ? (lang === "uz" ? "Maktab yangiliklari arxivi tayyorlanmoqda." : "The school news archive is being prepared.")
        : (lang === "uz" ? "Tasdiqlangan yutuqlar arxivi tayyorlanmoqda." : "The verified achievements archive is being prepared.");
  return <div className="public-empty"><Icon size={34} aria-hidden="true" /><h3>{text}</h3><p>{lang === "uz" ? "Yangi ma’lumot maktab rahbariyati tasdiqlaganidan so‘ng sana va manbasi bilan e’lon qilinadi." : "New information is published with its date and source after approval by school leadership."}</p></div>;
}

function departmentLabel(value: TeacherRecord["departments"][number], lang: Lang) {
  const labels = { stem: { uz: "Aniq va tabiiy fanlar", en: "STEM" }, languages: { uz: "Tillar", en: "Languages" }, "social-sciences": { uz: "Ijtimoiy fanlar", en: "Social sciences" }, primary: { uz: "Boshlang‘ich ta’lim", en: "Primary education" }, "arts-pe": { uz: "San’at va jismoniy tarbiya", en: "Arts & physical education" }, "student-support": { uz: "O‘quvchilarni qo‘llab-quvvatlash", en: "Student support" } };
  return labels[value][lang];
}
