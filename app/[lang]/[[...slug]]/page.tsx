/* eslint-disable @next/next/no-img-element -- Supabase returns short-lived signed image URLs. */
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  ArrowRight, BookOpen, Building2, CheckCircle2, Clock,
  BriefcaseBusiness, Camera, Code2, ExternalLink, FileText, Globe2, GraduationCap, HeartHandshake,
  Mail, MapPin, Phone, Play, Scale, Send, ShieldCheck, Sparkles, Target, Users,
} from "lucide-react";
import { AdminGateway } from "@/components/admin-gateway";
import { AchievementDirectory, NewsDirectory, TeacherDirectory } from "@/components/content-directory";
import { NewsPhotoGallery } from "@/components/news-photo-gallery";
import { NewsletterSignup } from "@/components/newsletter-signup";
import { SiteFooter, SiteHeader } from "@/components/site-shell";
import { copy, isLang, Lang, pillars, siteIdentity } from "@/lib/site-content";
import { loadPublishedContent, PublishedContent } from "@/lib/content-repository";
import { publicationCategoryLabel, publicationFormatLabel } from "@/lib/publications";

// A short cache removes repeated database and signed-image work while keeping updates timely.
export const revalidate = 120;

const validPages = ["home", "about", "academics", "teachers", "news", "achievements", "admissions", "contact", "legal", "privacy", "policies", "admin"];

export async function generateMetadata({ params }: { params: Promise<{ lang: string; slug?: string[] }> }): Promise<Metadata> {
  const { lang: rawLang, slug } = await params;
  if (!isLang(rawLang)) return {};
  const lang = rawLang as Lang;
  const page = slug?.[0] ?? "home";
  const detail = slug?.[1];
  const path = slug?.length ? slug.join("/") : "";
  const canonical = `/${lang}${path ? `/${path}` : ""}`;
  const languagePath = path ? `/${path}` : "";
  const alternates = {
    canonical,
    languages: {
      uz: `/uz${languagePath}`,
      en: `/en${languagePath}`,
    },
  };
  const content = detail ? await loadPublishedContent() : null;
  if (detail && page === "teachers") {
    const item = content?.teachers.find((record) => record.slug === detail);
    if (item) return { title: item.name[lang], description: item.biography[lang], alternates };
  }
  if (detail && page === "news") {
    const item = content?.news.find((record) => record.slug === detail);
    if (item) return { title: item.title[lang], description: item.excerpt[lang], alternates };
  }
  if (detail && page === "achievements") {
    const item = content?.achievements.find((record) => record.slug === detail);
    if (item) return { title: `${item.studentName} — ${item.credentialType}`, description: `${item.result} · ${item.academicYear}`, alternates };
  }
  if (page === "home") return { title: copy[lang].home.title, description: copy[lang].home.intro, alternates };
  if (page === "admin") return { title: lang === "uz" ? "Kontent boshqaruvi" : "Content management", robots: { index: false, follow: false } };
  const pageCopy = copy[lang].pages[page as keyof typeof copy[typeof lang]["pages"]];
  return pageCopy ? { title: pageCopy.title, description: pageCopy.intro, alternates } : {};
}

export default async function SchoolPage({ params }: { params: Promise<{ lang: string; slug?: string[] }> }) {
  const { lang: rawLang, slug } = await params;
  if (!isLang(rawLang)) notFound();
  const lang = rawLang as Lang;
  const page = slug?.[0] ?? "home";
  if (!validPages.includes(page) || (slug && slug.length > 2)) notFound();
  const detailSlug = slug?.[1];
  if (detailSlug && !["teachers", "news", "achievements"].includes(page)) notFound();
  const content = await loadPublishedContent();
  return (
    <div className="site-page">
      <SiteHeader lang={lang} current={slug?.join("/") ?? page} />
      <div id="main-content" tabIndex={-1}>
        {detailSlug ? <DetailPage lang={lang} page={page} slug={detailSlug} content={content} /> : page === "home" ? <HomePage lang={lang} news={content.news} /> : page === "admin" ? <AdminPage lang={lang} /> : <InnerPage lang={lang} page={page} content={content} />}
      </div>
      {page !== "admin" && <NewsletterSignup lang={lang} />}
      <SiteFooter lang={lang} />
    </div>
  );
}

function HomePage({ lang, news }: { lang: Lang; news: PublishedContent["news"] }) {
  const t = copy[lang];
  return (
    <main>
      <section className="hero-section">
        <div className="hero-copy">
          <p className="eyebrow">{t.home.eyebrow}</p>
          <h1>{t.home.title}</h1>
          <p className="hero-intro">{t.home.intro}</p>
          <div className="hero-actions">
            <Link className="button button-primary" href={`/${lang}/about`}>{t.home.primaryAction}<ArrowRight size={18} /></Link>
            <Link className="button button-secondary" href={`/${lang}/admissions`}>{t.home.secondaryAction}</Link>
          </div>
          <div className="hero-trust"><ShieldCheck size={21} /><span>{lang === "uz" ? "Litsenziya № 531978 • I–XI sinflar" : "Licence № 531978 • Grades 1–11"}</span></div>
        </div>
        <div className="hero-visual institutional-visual" role="img" aria-label={lang === "uz" ? "Maktabning rasmiy ta’lim profili" : "Official school education profile"}>
          <div className="credential-card">
            <div className="credential-heading"><span className="credential-seal">IEG</span><div><small>{lang === "uz" ? "Nodavlat ta’lim muassasasi" : "Non-state educational institution"}</small><strong>IZZATBEK-EDU-GROUP</strong></div></div>
            <div className="credential-body"><Building2 size={54} /><div><span>{lang === "uz" ? "Hazorasp tumani" : "Hazorasp District"}</span><small>{lang === "uz" ? "Xorazm viloyati" : "Khorezm Region"}</small></div></div>
            <div className="credential-footer"><div><small>{lang === "uz" ? "Litsenziya" : "Licence"}</small><strong>№ {siteIdentity.license}</strong></div><div><small>{lang === "uz" ? "Amal qilish muddati" : "Validity"}</small><strong>{lang === "uz" ? "Cheksiz" : "Unlimited"}</strong></div></div>
          </div>
          <div className="grade-band"><div><strong>I–IV</strong><span>{lang === "uz" ? "Boshlang‘ich" : "Primary"}</span></div><div><strong>V–IX</strong><span>{lang === "uz" ? "Tayanch o‘rta" : "Basic secondary"}</span></div><div><strong>X–XI</strong><span>{lang === "uz" ? "O‘rta" : "Secondary"}</span></div></div>
        </div>
      </section>

      <section className="trust-section facts-ribbon">
        <div><strong>1–11</strong><span>{lang === "uz" ? "Ta’lim sinflari" : "Grade levels"}</span></div>
        <div><strong>3</strong><span>{lang === "uz" ? "Ta’lim bosqichi" : "Education stages"}</span></div>
        <div><strong>2024</strong><span>{lang === "uz" ? "Litsenziya kuchga kirgan" : "Licence effective"}</span></div>
        <Link className="text-link" href={`/${lang}/legal`}>{lang === "uz" ? "Rasmiy ma’lumot" : "Official information"}<ArrowRight size={17} /></Link>
      </section>

      <section className="school-photo-feature home-school-photo">
        <img src="/images/school/school-entrance.webp" alt={lang === "uz" ? "IZZATBEK-EDU-GROUP maktabining asosiy kirish qismi" : "Main entrance of IZZATBEK-EDU-GROUP school"} />
        <div><p className="eyebrow">{lang === "uz" ? "Bizning maktab" : "Our school"}</p><h2>{lang === "uz" ? "Hazoraspda ta’lim uchun yaratilgan muhit" : "A learning environment in Hazorasp"}</h2><p>{lang === "uz" ? "Maktabning ta’lim faoliyati olib boriladigan rasmiy manzillaridan biri." : "One of the school’s official locations for educational activity."}</p><Link className="text-link" href={`/${lang}/about`}>{lang === "uz" ? "Maktab haqida" : "About the school"}<ArrowRight size={17} /></Link></div>
      </section>

      <section className="content-section">
        <div className="section-heading"><div><p className="eyebrow">{lang === "uz" ? "Asosiy yo‘nalishlar" : "Core principles"}</p><h2>{t.home.pillarsTitle}</h2></div><p>{t.home.pillarsIntro}</p></div>
        <div className="pillar-grid">
          {pillars[lang].map((item, index) => {
            const icons = [BookOpen, HeartHandshake, Sparkles]; const Icon = icons[index];
            return <article className="pillar-card" key={item.title}><span className="icon-tile"><Icon /></span><h3>{item.title}</h3><p>{item.body}</p></article>;
          })}
        </div>
      </section>

      {news.length > 0 ? <section className="content-section soft-section">
        <div className="section-heading"><div><p className="eyebrow">{t.nav.news}</p><h2>{t.home.latestTitle}</h2></div><p>{t.home.latestIntro}</p></div>
        <NewsGrid lang={lang} items={news} limit={3} />
        <Link className="text-link section-link" href={`/${lang}/news`}>{t.sections.viewAll}<ArrowRight size={17} /></Link>
      </section> : <section className="institution-section">
        <div className="institution-copy"><p className="eyebrow">{lang === "uz" ? "Maktab profili" : "School profile"}</p><h2>{lang === "uz" ? "Rasmiy, aniq va tekshiriladigan ma’lumot" : "Official, clear and verifiable information"}</h2><p>{lang === "uz" ? "Maktab haqidagi ma’lumotlar litsenziya hujjatlari va rahbariyat tomonidan tasdiqlangan manbalar asosida e’lon qilinadi." : "Information about the school is published from licence documents and sources approved by school leadership."}</p><Link className="button button-secondary" href={`/${lang}/legal`}>{lang === "uz" ? "Litsenziya ma’lumotlari" : "Licence information"}<ArrowRight size={18} /></Link></div>
        <div className="institution-facts"><article><span>01</span><div><strong>{lang === "uz" ? "Boshlang‘ich ta’lim" : "Primary education"}</strong><small>{lang === "uz" ? "I–IV sinflar" : "Grades 1–4"}</small></div></article><article><span>02</span><div><strong>{lang === "uz" ? "Tayanch o‘rta ta’lim" : "Basic secondary education"}</strong><small>{lang === "uz" ? "V–IX sinflar" : "Grades 5–9"}</small></div></article><article><span>03</span><div><strong>{lang === "uz" ? "O‘rta ta’lim" : "Secondary education"}</strong><small>{lang === "uz" ? "X–XI sinflar" : "Grades 10–11"}</small></div></article></div>
      </section>}

      <section className="newsletter-section official-contact-band">
        <div><p className="eyebrow">{lang === "uz" ? "Rasmiy aloqa" : "Official contact"}</p><h2>{lang === "uz" ? "Maktab bilan bog‘laning" : "Contact the school"}</h2><p>{siteIdentity.email}</p></div>
        <Link className="button button-light" href={`/${lang}/contact`}>{lang === "uz" ? "Aloqa ma’lumotlari" : "Contact information"}<ArrowRight size={18} /></Link>
      </section>
    </main>
  );
}

function InnerPage({ lang, page, content }: { lang: Lang; page: string; content: PublishedContent }) {
  const t = copy[lang];
  const pageCopy = t.pages[page as keyof typeof t.pages];
  if (!pageCopy) notFound();
  return (
    <main>
      <section className={`page-hero ${page === "achievements" ? "achievements-page-hero" : ""}`}><p className="eyebrow">{pageCopy.eyebrow}</p><h1>{pageCopy.title}</h1><p>{pageCopy.intro}</p></section>
      {page === "about" && <AboutContent lang={lang} />}
      {page === "academics" && <AcademicsContent lang={lang} />}
      {page === "teachers" && <TeachersContent lang={lang} items={content.teachers} />}
      {page === "news" && <NewsContent lang={lang} items={content.news} />}
      {page === "achievements" && <AchievementsContent lang={lang} items={content.achievements} />}
      {page === "admissions" && <AdmissionsContent lang={lang} />}
      {page === "contact" && <ContactContent lang={lang} />}
      {page === "legal" && <LegalContent lang={lang} />}
      {page === "privacy" && <PrivacyContent lang={lang} />}
      {page === "policies" && <PoliciesContent lang={lang} />}
    </main>
  );
}

function AboutContent({ lang }: { lang: Lang }) {
  const isUz = lang === "uz";
  const values = isUz
    ? [[Target, "Maqsad", "Maktabning tasdiqlangan missiyasi va o‘quvchilar oldidagi mas’uliyati."], [HeartHandshake, "Hamjamiyat", "O‘quvchi, oila va o‘qituvchi o‘rtasidagi hamkorlik."], [Sparkles, "Rivojlanish", "Bilim, xarakter va amaliy ko‘nikmalarni birgalikda rivojlantirish."]]
    : [[Target, "Purpose", "The school’s approved mission and responsibility to its students."], [HeartHandshake, "Community", "Partnership between students, families and teachers."], [Sparkles, "Growth", "Developing knowledge, character and practical skills together."]];
  return <section className="content-section page-content"><div className="split-panel"><SchoolPhoto src="/images/school/school-building.webp" alt={isUz ? "IZZATBEK-EDU-GROUP maktab binosi" : "IZZATBEK-EDU-GROUP school building"} className="about-building-photo" /><div><p className="eyebrow">{isUz ? "Maktab haqida" : "About the school"}</p><h2>{isUz ? "I–XI sinflar uchun ta’lim" : "Education for Grades 1–11"}</h2><p>{isUz ? '“IZZATBEK-EDU-GROUP” — Hazorasp tumanida faoliyat yurituvchi nodavlat ta’lim muassasasi. Maktab boshlang‘ich, tayanch o‘rta va o‘rta ta’lim xizmatlarini ko‘rsatish uchun litsenziyaga ega.' : '“IZZATBEK-EDU-GROUP” is a non-state educational institution operating in Hazorasp District. The school is licensed to provide primary, basic secondary and secondary education.'}</p><div className="director-card"><span>{isUz ? "Direktor" : "Director"}</span><strong>{siteIdentity.director}</strong></div></div></div><LicenceSummary lang={lang} /><div className="facility-photo-grid"><SchoolPhoto src="/images/school/general-classroom.webp" alt={isUz ? "Maktabdagi umumiy o‘quv xonasi" : "A general classroom at the school"} caption={isUz ? "Ta’lim muhiti" : "Learning environment"} /><SchoolPhoto src="/images/school/modern-classroom.webp" alt={isUz ? "Maktabdagi zamonaviy o‘quv xonasi" : "A modern classroom at the school"} caption={isUz ? "O‘quv xonalari" : "Classroom facilities"} /></div><div className="value-grid">{values.map(([Icon, title, body]) => <article key={String(title)}><Icon /><h3>{title as string}</h3><p>{body as string}</p></article>)}</div></section>;
}

function AcademicsContent({ lang }: { lang: Lang }) {
  const isUz = lang === "uz";
  const stages = isUz
    ? [[GraduationCap, "Boshlang‘ich ta’lim", "I–IV sinflar."], [Scale, "Tayanch o‘rta ta’lim", "V–IX sinflar."], [Sparkles, "O‘rta ta’lim", "X–XI sinflar."]]
    : [[GraduationCap, "Primary education", "Grades 1–4."], [Scale, "Basic secondary education", "Grades 5–9."], [Sparkles, "Secondary education", "Grades 10–11."]];
  const subjects = isUz
    ? ["Matematika", "Ingliz tili", "Tarix va huquq", "Biologiya va kimyo", "Ona tili va adabiyot"]
    : ["Mathematics", "English", "History and Law", "Biology and Chemistry", "Mother Tongue and Literature"];
  return <section className="content-section page-content"><div className="info-grid">{stages.map(([Icon, title, body]) => <article key={String(title)}><Icon /><h2>{title as string}</h2><p>{body as string}</p><span>{isUz ? "Tasdiqlangan ta’lim bosqichi" : "Confirmed education stage"}</span></article>)}</div><div className="academic-photo-grid"><SchoolPhoto src="/images/school/mathematics-classroom.webp" alt={isUz ? "Matematika uchun jihozlangan o‘quv xonasi" : "Classroom prepared for mathematics learning"} caption={isUz ? "Matematika" : "Mathematics"} /><SchoolPhoto src="/images/school/academic-classroom.webp" alt={isUz ? "Maktabdagi yorug‘ o‘quv xonasi" : "A bright academic classroom"} caption={isUz ? "Asosiy fanlar" : "Core subjects"} /><SchoolPhoto src="/images/school/primary-classroom.webp" alt={isUz ? "Boshlang‘ich sinflar uchun o‘quv xonasi" : "Classroom for younger learners"} caption={isUz ? "Boshlang‘ich ta’lim" : "Primary education"} /></div><div className="callout"><div><p className="eyebrow">{isUz ? "Chuqurlashtirilgan fanlar" : "Subjects taught in depth"}</p><h2>{isUz ? "Sertifikatlar va kirish imtihonlariga tayyorgarlik" : "Preparation for certificates and entrance examinations"}</h2><p>{subjects.join(" • ")}</p></div><BookOpen size={42} /></div></section>;
}

function LicenceSummary({ lang, compact = false }: { lang: Lang; compact?: boolean }) {
  const isUz = lang === "uz";
  return <section className={`licence-summary ${compact ? "compact" : ""}`} aria-labelledby={`licence-summary-${compact ? "compact" : "full"}`}><span className="licence-summary-mark"><ShieldCheck /></span><div><p className="eyebrow">{isUz ? "Litsenziyalangan ta’lim muassasasi" : "Licensed educational institution"}</p><h2 id={`licence-summary-${compact ? "compact" : "full"}`}>{isUz ? `Litsenziya № ${siteIdentity.license}` : `Licence № ${siteIdentity.license}`}</h2><p>{isUz ? `Maktab I–XI sinflar uchun cheksiz muddatga litsenziyalangan. Reyestr: ${siteIdentity.licenseOrder}.` : `The school is licensed indefinitely for Grades I–XI. Registry: ${siteIdentity.licenseOrder}.`}</p><div className="licence-summary-actions"><a className="button button-primary" href="/documents/izzatbek-edu-group-license-531978.pdf" target="_blank" rel="noreferrer"><FileText />{isUz ? "To‘liq litsenziyani ko‘rish" : "View full licence"}</a><Link className="text-link" href={`/${lang}/legal`}>{isUz ? "Yuridik ma’lumotlar" : "Legal details"}<ArrowRight /></Link></div></div></section>;
}

function TeachersContent({ lang, items }: { lang: Lang; items: PublishedContent["teachers"] }) {
  return <section className="content-section page-content"><TeacherDirectory lang={lang} items={items} /></section>;
}

function NewsGrid({ lang, items, limit }: { lang: Lang; items: PublishedContent["news"]; limit?: number }) {
  return <NewsDirectory lang={lang} items={items} limit={limit} />;
}

function NewsContent({ lang, items }: { lang: Lang; items: PublishedContent["news"] }) { return <section className="content-section page-content"><div className="student-life-feature"><SchoolPhoto src="/images/school/boys-learning.webp" alt={lang === "uz" ? "Dars jarayonidagi o‘quvchi bolalar" : "Boys taking part in a classroom lesson"} /><div><p className="eyebrow">{lang === "uz" ? "Maktab hayoti" : "Student life"}</p><h2>{lang === "uz" ? "Maktabdagi kundalik hayot va o‘quvchilar ovozi" : "Everyday learning and student voices"}</h2><p>{lang === "uz" ? "Bu bo‘limda darslar, tadbirlar va o‘quvchilar tajribasi haqidagi tasdiqlangan materiallar e’lon qilinadi." : "This section publishes approved stories about lessons, events and student experiences."}</p></div></div><NewsGrid lang={lang} items={items} /></section>; }

function AchievementsContent({ lang, items }: { lang: Lang; items: PublishedContent["achievements"] }) {
  return <section className="content-section page-content"><AchievementDirectory lang={lang} items={items} /></section>;
}

function AdmissionsContent({ lang }: { lang: Lang }) {
  const isUz = lang === "uz";
  const steps = isUz ? [["01", "Qo‘ng‘iroq qiling", "Qabul bo‘yicha maktabning rasmiy telefon raqamiga murojaat qiling."], ["02", "Maslahat oling", "Sinflar, mavjud joylar va kerakli hujjatlar haqida ma’lumot oling."], ["03", "Maktabga tashrif buyuring", "Keyingi qadamlar maktab ma’muriyati bilan kelishiladi."]] : [["01", "Call the school", "Contact the school through its official admissions telephone number."], ["02", "Receive a consultation", "Ask about grades, availability and required documents."], ["03", "Visit the school", "Agree the next steps directly with the school administration."]];
  const answers = isUz ? [
    ["Maslahat vaqtida nimalar aniqlanadi?", "Sinf, mavjud joylar, kerakli hujjatlar, ta’lim to‘lovi va tashrif vaqti maktab ma’muriyati bilan tasdiqlanadi."],
    ["Qachon qo‘ng‘iroq qilish mumkin?", `Maktab ${siteIdentity.callingHours} oralig‘ida qo‘ng‘iroqlarni qabul qiladi.`],
    ["Qayerga tashrif buyurish kerak?", siteIdentity.address],
  ] : [
    ["What is confirmed during the consultation?", "The school administration confirms the grade, available places, required documents, tuition and visit time."],
    ["When may families call?", `The school receives calls between ${siteIdentity.callingHours}.`],
    ["Where should families visit?", siteIdentity.address],
  ];
  return <section className="content-section page-content"><div className="process-grid">{steps.map(([n, title, body]) => <article key={n}><strong>{n}</strong><h2>{title}</h2><p>{body}</p></article>)}</div><div className="admissions-photo-panel"><SchoolPhoto src="/images/school/admissions-classroom.webp" alt={isUz ? "Qabul qilinadigan o‘quvchilar uchun tayyor o‘quv xonasi" : "A classroom ready for prospective students"} /><div><p className="eyebrow">{isUz ? "Maktabga tashrif" : "Visit the school"}</p><h2>{isUz ? "Ta’lim muhitini yaqindan ko‘ring" : "See the learning environment in person"}</h2><p>{isUz ? "Tashrif vaqtini oldindan telefon orqali maktab ma’muriyati bilan kelishib oling." : "Please arrange your visit with the school administration by telephone in advance."}</p></div></div><div className="admissions-faq"><p className="eyebrow">{isUz ? "Qabul bo‘yicha qisqa ma’lumot" : "Admissions at a glance"}</p>{answers.map(([question, answer]) => <article key={question}><h2>{question}</h2><p>{answer}</p></article>)}</div><LicenceSummary lang={lang} compact /><div className="callout"><div><p className="eyebrow">{isUz ? "Ta’lim to‘lovi" : "Tuition"}</p><h2>{isUz ? "Ma’lumot individual maslahat davomida beriladi" : "Information is provided during an individual consultation"}</h2></div><Link className="button button-primary" href={`/${lang}/contact`}>{isUz ? "Bog‘lanish" : "Contact the school"}<ArrowRight size={18} /></Link></div></section>;
}

function SchoolPhoto({ src, alt, caption, className = "" }: { src: string; alt: string; caption?: string; className?: string }) {
  return <figure className={`school-photo ${className}`.trim()}><img src={src} alt={alt} loading="lazy" />{caption && <figcaption>{caption}</figcaption>}</figure>;
}

function ContactContent({ lang }: { lang: Lang }) {
  const isUz = lang === "uz";
  return <section className="content-section page-content"><div className="contact-details standalone"><article><MapPin /><div><h2>{isUz ? "Maktab manzili" : "School address"}</h2><p>{siteIdentity.address}</p></div></article><article><Phone /><div><h2>{isUz ? "Telefon" : "Phone"}</h2><a href={`tel:${siteIdentity.phoneHref}`}>{siteIdentity.phone}</a></div></article><article><Clock /><div><h2>{isUz ? "Qo‘ng‘iroq qilish vaqti" : "Calling hours"}</h2><p>{siteIdentity.callingHours}</p></div></article><article><Mail /><div><h2>{isUz ? "Elektron pochta" : "Email"}</h2><a href={`mailto:${siteIdentity.email}`}>{siteIdentity.email}</a></div></article><a className="map-link-card" href={siteIdentity.mapsUrl} target="_blank" rel="noreferrer"><MapPin /><div><strong>{isUz ? "Google Maps’da ochish" : "Open in Google Maps"}</strong><span>{isUz ? "Maktab joylashuvini xaritada ko‘ring" : "View the school location on the map"}</span></div><ArrowRight size={20} /></a></div><div className="info-grid social-links-grid"><a href={siteIdentity.telegramUrl} target="_blank" rel="noreferrer"><Send /><h2>{isUz ? "Rasmiy Telegram guruhi" : "Official Telegram group"}</h2><p>{isUz ? "Faqat e’lonlar — a’zolar uchun yozish yopiq" : "Announcements only — member messaging is disabled"}</p></a><a href={siteIdentity.schoolInstagramUrl} target="_blank" rel="noreferrer"><Camera /><h2>{isUz ? "Maktab Instagram sahifasi" : "School Instagram"}</h2><p>@izzatbek_oliytalim_maktabi</p></a><a href={siteIdentity.directorInstagramUrl} target="_blank" rel="noreferrer"><Camera /><h2>{isUz ? "Direktor Instagram sahifasi" : "Director’s Instagram"}</h2><p>@izzatbekedu</p></a></div></section>;
}

function LegalContent({ lang }: { lang: Lang }) {
  const isUz = lang === "uz";
  const rows = [[isUz ? "Yuridik nom" : "Legal name", siteIdentity.legalName], [isUz ? "Tashkilot turi" : "Institution type", isUz ? "Nodavlat ta’lim muassasasi" : "Non-state educational institution"], [isUz ? "Litsenziya raqami" : "Licence number", siteIdentity.license], [isUz ? "Reyestr tartib raqami" : "Registry order number", siteIdentity.licenseOrder], [isUz ? "Amal qilish muddati" : "Validity", `${siteIdentity.licenseEffectiveFrom} — ${isUz ? "cheksiz" : "unlimited"}`], [isUz ? "Faoliyat turi" : "Licensed activity", siteIdentity.licensedActivity], [isUz ? "Litsenziyalangan sinflar" : "Licensed grades", siteIdentity.licensedGrades], [isUz ? "Vakolatli organ" : "Issuing authority", siteIdentity.licenseAuthority], [isUz ? "Yuridik manzil" : "Legal address", siteIdentity.legalAddress], [isUz ? "Ta’lim faoliyati manzillari" : "Licensed activity addresses", siteIdentity.activityAddresses.join("; ")], [isUz ? "Domen" : "Domain", siteIdentity.domain]];
  return <section className="content-section page-content"><div className="legal-warning"><ShieldCheck /><div><h2>{isUz ? "Rasmiy ma’lumot va to‘liq litsenziya" : "Official information and complete licence"}</h2><p>{isUz ? "Quyidagi ma’lumotlar maktab litsenziyasiga asoslangan. To‘liq ikki sahifali litsenziyani ko‘rish yoki yuklab olish mumkin." : "The information below is based on the school licence. The complete two-page licence may be viewed or downloaded."}</p><a className="button button-primary" href="/documents/izzatbek-edu-group-license-531978.pdf" target="_blank" rel="noreferrer"><FileText />{isUz ? "Litsenziya PDF-ni ochish" : "Open licence PDF"}</a><small>{isUz ? "So‘nggi yangilanish: 10.09.2026" : "Last updated: 10 September 2026"}</small></div></div><dl className="legal-list">{rows.map(([term, value]) => <div key={term}><dt>{term}</dt><dd>{value}</dd></div>)}</dl></section>;
}

function PoliciesContent({ lang }: { lang: Lang }) {
  const isUz = lang === "uz";
  const policies = isUz ? [
    ["Bolalarni himoya qilish", "Bola xavfsizligi birinchi o‘rinda turadi. Xavf yoki noo‘rin xatti-harakat haqidagi xabar darhol maktab rahbariyatiga yuboriladi; favqulodda vaziyatda vakolatli xizmatlarga murojaat qilinadi."],
    ["Fotosurat va rozilik", "Voyaga yetmagan o‘quvchining aniqlanishi mumkin bo‘lgan surati faqat ota-ona yoki qonuniy vakilning tegishli roziligi va maktab tasdig‘i bilan e’lon qilinadi. Rozilik qaytarib olinsa, material imkon qadar tez olib tashlanadi."],
    ["Tahririyat siyosati", "Maqolalar aniqlik, hurmat va maktab hamjamiyatiga foyda mezonlari bo‘yicha tahrir qilinadi. Mualliflik ko‘rsatiladi; shaxsiy hujum, kamsitish, plagiat va maxfiy ma’lumotga yo‘l qo‘yilmaydi."],
    ["Shikoyat va tuzatish", `Xato, maxfiylik yoki nashr bo‘yicha shikoyatni ${siteIdentity.email} manziliga yuboring. Maktab murojaatni ko‘rib chiqadi, zarur bo‘lsa materialni tuzatadi, yangilaydi yoki olib tashlaydi.`],
    ["Accessibility", "Sayt klaviatura navigatsiyasi, mazmunli sarlavhalar, alternativ rasm matni, tushunarli rang kontrasti va mobil qurilmalarda o‘qishni qo‘llab-quvvatlashga intiladi. To‘siq topsangiz, bizga xabar bering."],
    ["Ma’lumotlarni saqlash", "Newsletter ma’lumotlari obuna davomida va qonuniy yoki operatsion zarurat bo‘lgan muddatgacha saqlanadi. Obunani bekor qilgan manzil qayta yuborishni oldini olish uchun cheklangan rad etish yozuvi sifatida saqlanishi mumkin."],
  ] : [
    ["Child safeguarding", "A child’s safety comes first. Concerns about risk or inappropriate conduct are referred promptly to school leadership and, in an emergency, to the appropriate authorities."],
    ["Photography and consent", "An identifiable image of a minor is published only with appropriate parent or legal-guardian consent and school approval. If consent is withdrawn, the material will be removed as soon as reasonably possible."],
    ["Editorial policy", "Stories are edited for accuracy, respect and value to the school community. Authorship is credited; personal attacks, discrimination, plagiarism and confidential information are not accepted."],
    ["Complaints and corrections", `Report an error, privacy concern or publishing complaint to ${siteIdentity.email}. The school will review it and, where appropriate, correct, update or remove the material.`],
    ["Accessibility", "The site aims to support keyboard navigation, meaningful headings, alternative image text, readable contrast and mobile use. Please contact us if you encounter a barrier."],
    ["Data retention", "Newsletter data is retained while a subscription is active and for as long as there is a lawful or operational need. After unsubscribe, a limited suppression record may be retained to prevent further delivery."],
  ];
  return <section className="content-section page-content"><div className="policy-grid">{policies.map(([title, body]) => <article key={title}><ShieldCheck /><div><h2>{title}</h2><p>{body}</p></div></article>)}</div><div className="policy-note"><strong>{isUz ? "Qo‘llanish doirasi" : "Scope"}</strong><p>{isUz ? "Ushbu qoidalar maktabning veb-sayti va tahririyat faoliyatiga taalluqli. Ular O‘zbekiston qonunchiligi va maktab rahbariyatining tasdiqlangan tartiblarini almashtirmaydi." : "These rules apply to the school website and editorial activity. They do not replace applicable Uzbek law or formally approved school procedures."}</p><small>{isUz ? "Ko‘rib chiqilgan sana: 10.09.2026" : "Reviewed: 10 September 2026"}</small></div></section>;
}

function PrivacyContent({ lang }: { lang: Lang }) {
  const isUz = lang === "uz";
  const items = isUz ? [["Formalar", "Aloqa va obuna ma’lumotlari faqat ko‘rsatilgan maqsad uchun ishlatiladi."], ["Fotosuratlar", "O‘quvchilar va xodimlar suratlari faqat tegishli ruxsat bilan e’lon qilinadi."], ["Tanlov", "Obunani istalgan vaqtda bekor qilish va ma’lumotni tuzatishni so‘rash mumkin."], ["Xavfsizlik", "Administrator huquqlari vazifaga qarab cheklanadi va muhim harakatlar qayd etiladi."]] : [["Forms", "Contact and subscription data is used only for the stated purpose."], ["Photography", "Images of students and staff are published only with appropriate permission."], ["Choice", "Subscribers can unsubscribe and people may request correction of their information."], ["Security", "Administrative access is limited by role and important actions are recorded."]];
  return <section className="content-section page-content"><div className="info-grid">{items.map(([title, body], i) => { const Icon = [Mail, Users, CheckCircle2, ShieldCheck][i]; return <article key={title}><Icon /><h2>{title}</h2><p>{body}</p></article>; })}</div></section>;
}

function DetailPage({ lang, page, slug, content }: { lang: Lang; page: string; slug: string; content: PublishedContent }) {
  if (page === "teachers") {
    const teacher = content.teachers.find((item) => item.slug === slug);
    if (!teacher) notFound();
    const hasLinks = Boolean(teacher.email || teacher.cvUrl || teacher.relatedLinks.length);
    const departments = teacher.departments.map((item) => teacherDepartmentLabel(item, lang));
    return <main className="faculty-profile-page">
      <div className="faculty-profile-shell">
        <Link className="faculty-back-link" href={`/${lang}/teachers`}>← {lang === "uz" ? "Jamoaga qaytish" : "Back to the team"}</Link>
        <header className="faculty-profile-header">
          <div className="faculty-portrait">{teacher.imageUrl ? <img src={teacher.imageUrl} alt={lang === "uz" ? `${teacher.name[lang]}, ${teacher.role[lang]}` : `Portrait of ${teacher.name[lang]}, ${teacher.role[lang]}`} /> : <span>{teacher.initials}</span>}</div>
          <div className="faculty-identity">
            <p className="eyebrow">{lang === "uz" ? "O‘qituvchi profili" : "Faculty profile"}</p>
            <h1>{teacher.name[lang]}</h1>
            <p className="faculty-role">{teacher.role[lang]}</p>
            {(teacher.isLeadership || departments.length > 0) && <div className="faculty-affiliations">{teacher.isLeadership && <span>{lang === "uz" ? "Rahbariyat" : "Leadership"}</span>}{departments.map((item) => <span key={item}>{item}</span>)}</div>}
            {teacher.biography[lang] && <p className="faculty-biography">{teacher.biography[lang]}</p>}
          </div>
        </header>
        <div className={`faculty-profile-content ${hasLinks ? "has-sidebar" : ""}`}>
          {hasLinks && <aside className="faculty-contact" aria-labelledby="teacher-links-title">
            <h2 id="teacher-links-title">{lang === "uz" ? "Aloqa va havolalar" : "Contact and links"}</h2>
            <div className="teacher-link-grid">{teacher.email && <a className="teacher-profile-link" href={`mailto:${teacher.email}`}><Mail /><span><small>{lang === "uz" ? "Elektron pochta" : "Email"}</small><strong>{teacher.email}</strong></span></a>}{teacher.cvUrl && <a className="teacher-profile-link" href={teacher.cvUrl} target="_blank" rel="noreferrer"><FileText /><span><small>CV</small><strong>{lang === "uz" ? "CV yoki professional profil" : "CV or professional profile"}</strong></span><ExternalLink className="external-mark" /></a>}{teacher.relatedLinks.map((item) => <a className="teacher-profile-link" href={item.url} target="_blank" rel="noreferrer" key={`${item.url}-${item.label[lang]}`}><TeacherLinkIcon url={item.url} /><span><small>{linkService(item.url)}</small><strong>{item.label[lang]}</strong></span><ExternalLink className="external-mark" /></a>)}</div>
          </aside>}
          <div className="faculty-profile-main">
            {teacher.subjects[lang].length > 0 && <section className="faculty-section"><p className="faculty-section-label">{lang === "uz" ? "Ta’lim yo‘nalishlari" : "Teaching areas"}</p><h2>{lang === "uz" ? "O‘qitadigan fanlar" : "Subjects taught"}</h2><ul className="faculty-subjects">{teacher.subjects[lang].map((item) => <li key={item}>{item}</li>)}</ul></section>}
            {teacher.qualifications[lang].length > 0 && <section className="faculty-section"><p className="faculty-section-label">{lang === "uz" ? "Kasbiy ma’lumot" : "Professional information"}</p><h2>{lang === "uz" ? "Faoliyati va tajribasi" : "Profile and experience"}</h2><div className="faculty-prose">{teacher.qualifications[lang].map((item) => <p key={item}>{item}</p>)}</div></section>}
          </div>
        </div>
      </div>
    </main>;
  }
  if (page === "news") {
    const item = content.news.find((record) => record.slug === slug);
    if (!item) notFound();
    return <main><article className="article-detail publication-detail"><div className="publication-detail-meta"><span>{publicationCategoryLabel(item.category, lang)}</span><span>{publicationFormatLabel(item.format, lang)}</span><time>{item.date}</time></div><h1>{item.title[lang]}</h1>{item.author && <div className="article-byline"><span>{lang === "uz" ? "Muallif" : "Written by"}</span><strong>{item.author.name}</strong><small>{item.author.role[lang]}</small></div>}{item.imageUrl && <img className="article-cover-image" src={item.imageUrl} alt={item.title[lang]} />}<p className="article-lead">{item.excerpt[lang]}</p>{item.body[lang].map((paragraph) => <p key={paragraph}>{paragraph}</p>)}{item.galleryUrls.length > 0 && <NewsPhotoGallery lang={lang} title={item.title[lang]} images={item.galleryUrls} />}<Link className="text-link back-link" href={`/${lang}/news`}>← {lang === "uz" ? "Nashrlarga qaytish" : "Back to publications"}</Link></article></main>;
  }
  if (page === "achievements") {
    const item = content.achievements.find((record) => record.slug === slug);
    if (!item) notFound();
    return <main><article className="article-detail"><p className="eyebrow">{item.credentialType} · {item.academicYear}</p><h1>{item.studentName}</h1><p className="article-lead">{item.result}</p>{item.subject[lang] && <p>{item.subject[lang]}</p>}{item.imageUrl && <img className="article-cover-image achievement-document-image" src={item.imageUrl} alt={lang === "uz" ? `${item.studentName} sertifikati` : `${item.studentName} certificate`} />}<div className="legal-warning"><ShieldCheck /><div><h2>{lang === "uz" ? "Tasdiqlangan natija" : "Verified result"}</h2><p>{lang === "uz" ? "Natija maktab tomonidan tekshirilgan va tasdiqlangan." : "The result has been reviewed and verified by the school."}</p>{item.source && <a href={item.source} target="_blank" rel="noreferrer">{lang === "uz" ? "Tasdiqlash manbasi" : "Verification source"}</a>}</div></div><Link className="text-link back-link" href={`/${lang}/achievements`}>← {lang === "uz" ? "Yutuqlarga qaytish" : "Back to achievements"}</Link></article></main>;
  }
  notFound();
}

function TeacherLinkIcon({ url }: { url: string }) {
  const service = linkService(url);
  if (service === "Instagram") return <Camera />;
  if (service === "Telegram") return <Send />;
  if (service === "LinkedIn") return <BriefcaseBusiness />;
  if (service === "YouTube") return <Play />;
  if (service === "Facebook") return <Users />;
  if (service === "GitHub") return <Code2 />;
  if (service === "PDF") return <FileText />;
  return <Globe2 />;
}

function teacherDepartmentLabel(value: string, lang: Lang) {
  const labels: Record<string, { uz: string; en: string }> = {
    stem: { uz: "Aniq va tabiiy fanlar", en: "STEM" },
    languages: { uz: "Tillar", en: "Languages" },
    "social-sciences": { uz: "Ijtimoiy fanlar", en: "Social sciences" },
    primary: { uz: "Boshlang‘ich ta’lim", en: "Primary education" },
    "arts-pe": { uz: "San’at va jismoniy tarbiya", en: "Arts & physical education" },
    "student-support": { uz: "O‘quvchilarni qo‘llab-quvvatlash", en: "Student support" },
  };
  return labels[value]?.[lang] ?? value;
}

function linkService(value: string) {
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/^www\./, "").toLowerCase();
    if (host === "instagram.com") return "Instagram";
    if (host === "t.me" || host === "telegram.me") return "Telegram";
    if (host === "linkedin.com") return "LinkedIn";
    if (host === "youtube.com" || host === "youtu.be") return "YouTube";
    if (host === "facebook.com" || host === "fb.com") return "Facebook";
    if (host === "github.com") return "GitHub";
    if (url.pathname.toLowerCase().endsWith(".pdf")) return "PDF";
    return host;
  } catch { return "Website"; }
}

function AdminPage({ lang }: { lang: Lang }) {
  return <main><section className="page-hero compact"><p className="eyebrow">{lang === "uz" ? "Kontent boshqaruvi" : "Content management"}</p><h1>{lang === "uz" ? "Maktab kontentini xavfsiz boshqarish" : "Manage school content safely"}</h1><p>{lang === "uz" ? "Qoralamalar ommaga ko‘rinmaydi; faqat tasdiqlangan yozuvlar nashr qilinadi." : "Drafts remain private; only approved records are published."}</p></section><div className="admin-wrap"><AdminGateway lang={lang} /></div></main>;
}

export function generateStaticParams() { return [{ lang: "uz", slug: [] }, { lang: "en", slug: [] }]; }
