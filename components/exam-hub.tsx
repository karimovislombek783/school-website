"use client";

import { useEffect, useState } from "react";
import { ArrowDown, ArrowUpRight, BookOpen, CalendarDays, Check, ChevronDown, Clock3, Globe2, Search, ShieldCheck } from "lucide-react";
import type { Lang } from "@/lib/site-content";
import { exams, type Exam, type Session } from "@/lib/exams/data";
import { reviewDue, sessionStatus, tashkentDay, type SessionStatus } from "@/lib/exams/status";
import styles from "./exam-hub.module.css";

const labels = {
  uz: { title:"Imtihonga yo‘l shu yerdan boshlanadi",intro:"Milliy va xalqaro imtihonlar: muhim sanalar, ro‘yxatdan o‘tish yo‘riqnomalari va rasmiy manbalar bir joyda.",eyebrow:"O‘quvchilar uchun · Imtihonlar",all:"Barchasi",national:"Milliy",international:"Xalqaro",search:"Imtihon yoki fan qidiring",agenda:"Yaqin muddatlar",agendaIntro:"Ro‘yxatdan o‘tish muddatlari. Joylar mavjudligini rasmiy portalda tekshiring.",guides:"Imtihonni tanlang",guideIntro:"Kimlar uchun, qanday yozilish va imtihondan keyin nima qilish kerak?",guide:"Ro‘yxatdan o‘tish yo‘riqnomasi",official:"Rasmiy ro‘yxatdan o‘tish",prep:"Tayyorgarlik manbasi",checked:"Tekshirilgan",sources:"Rasmiy manbalar",dates:"Sessiyalar va muddatlar",exam:"Imtihon",deadline:"Ro‘yxat yakuni",payment:"To‘lov",late:"Kechikkan ro‘yxat",audience:"Kimlar uchun?",format:"Imtihon formati",fee:"To‘lov miqdori",documents:"Nimalar kerak?",results:"Ruxsatnoma va natijalar",steps:"Qanday ro‘yxatdan o‘tiladi?",empty:"Mos imtihon topilmadi. Qidiruv yoki filtrni o‘zgartiring.",noDates:"Bu filtr uchun yaqin muddatlar yo‘q. Yo‘riqnomalarni quyida ko‘ring.",rolling:"Sana va joyni tanlang",rollingBody:"IELTS sanalari provayderning bronlash tizimida. Bo‘sh joylar shaharga qarab farq qiladi.",note:"Ma’lumotlar rasmiy manbalardan tekshirildi. Arizani rasmiy portalda topshirasiz; bu sahifa joy band qilmaydi. Aniq shaxsiy vaqt va joy uchun ruxsatnomangizni tekshiring.",review:"Qayta tekshirish kerak",reviewNote:"So‘nggi tekshiruvdan 7 kundan oshdi. Ro‘yxat ochiqligini rasmiy manbada tasdiqlang.",todayNote:"Manbada yopilish soati berilmagan — 23:59 deb taxmin qilmang.",time:"Toshkent vaqti",reset:"Filtrlarni tozalash",showClosed:"Yopilgan muddatlarni ko‘rsatish",manual:"Oxirgi tahrir: 24.10.2026 · Rasmiy manbalarga havolalar har bir imtihon ostida." },
  en: { title:"Your next exam starts here",intro:"National and international exams: important dates, registration guides and official sources in one place.",eyebrow:"For students · Exam hub",all:"All exams",national:"National",international:"International",search:"Search an exam or subject",agenda:"Upcoming deadlines",agendaIntro:"Registration deadlines. Check seat availability in the official portal.",guides:"Choose your exam",guideIntro:"Who it is for, how to register and what comes after the test.",guide:"Registration guide",official:"Official registration",prep:"Preparation resources",checked:"Checked",sources:"Official sources",dates:"Sessions & deadlines",exam:"Exam",deadline:"Registration closes",payment:"Payment",late:"Late registration",audience:"Who is it for?",format:"Test format",fee:"Fees",documents:"What do you need?",results:"Permits & results",steps:"How to register",empty:"No matching exams. Try another search or filter.",noDates:"No upcoming deadlines for this filter. See the guides below.",rolling:"Choose a date and seat",rollingBody:"IELTS appointments are listed in the provider’s booking system. Availability varies by city.",note:"Information was checked against official sources. Apply through the official portal; this page does not reserve seats. Check your permit for your personal time and venue.",review:"Recheck needed",reviewNote:"More than 7 days since the last review. Confirm registration availability with the official source.",todayNote:"No closing time is stated in the source — do not assume 11:59 p.m.",time:"Tashkent time",reset:"Clear filters",showClosed:"Show closed deadlines",manual:"Last edited: 24 Oct 2026 · Official source links are listed with each exam." },
};
const statusLabels: Record<Lang, Record<SessionStatus,string>> = {
  uz: {closed:"Yopilgan",late:"Kechikkan ro‘yxat",today:"Bugun yakunlanadi",soon:"Yaqinda yakunlanadi",open:"Ro‘yxat davri",upcoming:"Hali boshlanmagan"},
  en: {closed:"Closed",late:"Late registration",today:"Closes today",soon:"Closing soon",open:"Registration window",upcoming:"Not yet open"},
};
const monthNames: Record<Lang, string[]> = {
  uz: ["yan", "fev", "mart", "apr", "may", "iyun", "iyul", "avg", "sen", "okt", "noy", "dek"],
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
};
function month(day: string, lang: Lang) { return monthNames[lang][Number(day.slice(5,7))-1]; }
function date(day: string, lang: Lang) { return `${Number(day.slice(8))} ${month(day,lang)} ${day.slice(0,4)}`; }
function localTime(instant: string, lang: Lang) {
  const values = new Intl.DateTimeFormat("en-GB",{year:"numeric",day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit",hour12:false,timeZone:"Asia/Tashkent"}).formatToParts(new Date(instant));
  const part = (type: string) => values.find(item=>item.type===type)?.value ?? "";
  return `${Number(part("day"))} ${monthNames[lang][Number(part("month"))-1]} ${part("hour")}:${part("minute")}`;
}
function Status({session, now, lang, stale = false}: {session:Session;now:Date;lang:Lang;stale?:boolean}) {
  const state = sessionStatus(session,now);
  const recheck = stale && state !== "closed";
  return <span className={`${styles.badge} ${styles[recheck ? "upcoming" : state]}`}>{recheck ? labels[lang].review : statusLabels[lang][state]}</span>;
}
function OfficialLink({href,children,className}: {href:string;children:React.ReactNode;className?:string}) {return <a className={className} href={href} target="_blank" rel="noopener noreferrer">{children}<ArrowUpRight size={15} aria-hidden="true"/></a>;}

export function ExamHub({lang,initialNow}: {lang:Lang;initialNow:string}) {
  const l=labels[lang];
  const [now,setNow]=useState(()=>new Date(initialNow));
  const [category,setCategory]=useState("all");
  const [query,setQuery]=useState("");
  const [closed,setClosed]=useState(false);
  useEffect(()=>{setNow(new Date());const timer=setInterval(()=>setNow(new Date()),60000);return ()=>clearInterval(timer);},[]);
  const filtered=exams.filter(exam=>(category==="all"||exam.category===category)&&`${exam.name.uz} ${exam.name.en} ${exam.provider} ${exam.sessions.map(s=>`${s.label.uz} ${s.label.en}`).join(" ")}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  const agenda=filtered.flatMap(exam=>exam.sessions.map(session=>({exam,session}))).filter(({session})=>closed||sessionStatus(session,now)!=="closed").sort((a,b)=> {
    const key=(s:Session)=>sessionStatus(s,now)==="late"?s.lateClosesAt!:s.closesAt||`${s.deadline}T23:59:00+05:00`;
    return Date.parse(key(a.session))-Date.parse(key(b.session));
  }).slice(0,8);
  const urgent=exams.flatMap(exam=>exam.sessions).filter(s=>["today","soon","late"].includes(sessionStatus(s,now))).length;
  return <main className={styles.hub}>
    <section className={styles.hero}>
      <div><p className={styles.eyebrow}>{l.eyebrow}</p><h1>{l.title}</h1><p className={styles.intro}>{l.intro}</p><a className={styles.heroLink} href="#exam-guides">{l.guides}<ArrowDown size={17}/></a></div>
      <div className={styles.heroPanel}><CalendarDays size={30} aria-hidden="true"/><strong>{date(tashkentDay(now),lang)}</strong><span>{l.time} · UTC+5</span><div><span>{lang==="uz"?"4 ta imtihon yo‘nalishi":"4 exam guides"}</span><span>{urgent} {lang==="uz"?"ta yaqin muddat":"deadlines approaching"}</span></div></div>
    </section>
    <div className={styles.toolbar}>
      <div className={styles.filters} aria-label={lang==="uz"?"Imtihon turi":"Exam category"}>{["all","national","international"].map(item=><button key={item} type="button" aria-pressed={category===item} onClick={()=>setCategory(item)}>{l[item as "all"|"national"|"international"]}</button>)}</div>
      <label className={styles.search}><Search size={18} aria-hidden="true"/><span className={styles.srOnly}>{l.search}</span><input value={query} onChange={event=>setQuery(event.target.value)} placeholder={l.search} type="search"/></label>
    </div>
    <section className={styles.agenda} aria-labelledby="deadlines-title">
      <div className={styles.sectionHeading}><div><p className={styles.eyebrow}><Clock3 size={15}/>{lang==="uz"?"Rejangizni tuzing":"Plan ahead"}</p><h2 id="deadlines-title">{l.agenda}</h2><p>{l.agendaIntro}</p></div><label className={styles.checkbox}><input type="checkbox" checked={closed} onChange={e=>setClosed(e.target.checked)}/>{l.showClosed}</label></div>
      {agenda.length ? <ul className={styles.deadlines}>{agenda.map(({exam,session})=>{
        const late=sessionStatus(session,now)==="late";
        const day=late?session.lateDeadline!:session.deadline;
        const instant=late?session.lateClosesAt:session.closesAt;
        return <li key={session.id}><div className={styles.dateTile}><span>{month(day,lang)}</span><strong>{day.slice(8)}</strong></div><div className={styles.deadlineMain}><a href={`#guide-${exam.id}`}>{exam.name[lang]} · {session.label[lang]}</a><p>{l.exam}: {date(session.examDate,lang)}{session.examEnd&&` – ${date(session.examEnd,lang)}`}</p><small>{instant?`${localTime(instant,lang)} · ${l.time}`:l.todayNote}</small></div><Status session={session} now={now} lang={lang} stale={reviewDue(exam.checked,now)}/></li>;
      })}</ul>:<p className={styles.empty}>{l.noDates}</p>}
      {filtered.some(exam=>exam.rolling)&&<div className={styles.rolling}><Globe2 size={22}/><div><strong>IELTS · {l.rolling}</strong><p>{l.rollingBody}</p></div><a href="#guide-ielts">{l.guide}<ArrowDown size={16}/></a></div>}
    </section>
    <section id="exam-guides" className={styles.guideSection} aria-labelledby="guides-title"><div className={styles.sectionHeading}><div><p className={styles.eyebrow}><BookOpen size={16}/>{lang==="uz"?"Bosqichma-bosqich":"Step by step"}</p><h2 id="guides-title">{l.guides}</h2><p>{l.guideIntro}</p></div><span className={styles.count} aria-live="polite">{filtered.length} / {exams.length}</span></div>
      <div className={styles.cards}>{filtered.map(exam=><ExamCard key={exam.id} exam={exam} now={now} lang={lang}/>)}</div>
      {!filtered.length&&<div className={styles.empty}><p>{l.empty}</p><button onClick={()=>{setCategory("all");setQuery("");}}>{l.reset}</button></div>}
    </section>
    <aside className={styles.sourceNote}><ShieldCheck size={25}/><div><p>{l.note}</p><small>{l.manual}</small></div></aside>
  </main>;
}
function ExamCard({exam,now,lang}: {exam:Exam;now:Date;lang:Lang}) {
  const l=labels[lang];const stale=reviewDue(exam.checked,now);
  return <article className={styles.card} id={`guide-${exam.id}`}>
    <div className={styles.cardHeader}><span className={styles.category}>{exam.category==="national"?l.national:l.international}</span><span className={styles.checked}><Check size={13}/>{l.checked}: {date(exam.checked,lang)}</span></div>
    <h3>{exam.name[lang]}</h3><p className={styles.provider}>{exam.provider}</p><p className={styles.summary}>{exam.summary[lang]}</p>
    {stale&&<p className={styles.notice}>{l.reviewNote}</p>}
    <div className={styles.cardActions}><OfficialLink className={styles.primary} href={exam.registration}>{l.official}</OfficialLink><OfficialLink className={styles.secondary} href={exam.preparation}>{l.prep}</OfficialLink></div>
    <details className={styles.details}><summary>{l.guide}<ChevronDown size={18}/></summary><div className={styles.detailsBody}>
      <dl className={styles.facts}>{(["audience","format","fee","documents"] as const).map(key=><div key={key}><dt>{l[key]}</dt><dd>{exam[key][lang]}</dd></div>)}</dl>
      <h4>{l.steps}</h4><ol className={styles.steps}>{exam.steps.map((step,index)=><li key={index}><span>{index+1}</span><p>{step[lang]}</p></li>)}</ol>
      <div className={styles.notice}>{exam.notice[lang]}</div>
      <h4>{l.dates}</h4>{exam.rolling?<p>{l.rollingBody}</p>:<div className={styles.sessions}>{exam.sessions.map(s=><section key={s.id} className={styles.session}><div><strong>{s.label[lang]}</strong><Status session={s} now={now} lang={lang} stale={stale}/></div><dl><div><dt>{l.exam}</dt><dd>{date(s.examDate,lang)}{s.examEnd&&` – ${date(s.examEnd,lang)}`}</dd></div><div><dt>{l.deadline}</dt><dd>{date(s.deadline,lang)}{s.closesAt&&<small>{localTime(s.closesAt,lang)} · {l.time}</small>}{!s.closesAt&&<small>{l.todayNote}</small>}</dd></div>{s.lateDeadline&&<div><dt>{l.late}</dt><dd>{date(s.lateDeadline,lang)}{s.lateClosesAt&&<small>{localTime(s.lateClosesAt,lang)} · {l.time}</small>}</dd></div>}<div><dt>{l.payment}</dt><dd>{s.payment[lang]}</dd></div></dl><OfficialLink href={s.source}>{l.sources}</OfficialLink></section>)}</div>}
      <h4>{l.results}</h4><p>{exam.results[lang]}</p>
      <h4>{l.sources}</h4><ul className={styles.sources}>{exam.sources.map(source=><li key={source.url}><OfficialLink href={source.url}>{source.label}</OfficialLink></li>)}</ul>
    </div></details>
  </article>;
}
