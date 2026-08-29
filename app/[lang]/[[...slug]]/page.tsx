/* eslint-disable @next/next/no-img-element -- Supabase returns short-lived signed image URLs. */
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  ArrowRight, BookOpen, Building2, CheckCircle2,
  GraduationCap, HeartHandshake, Mail, MapPin, Phone,
  Scale, ShieldCheck, Sparkles, Target, Users,
} from "lucide-react";
import { AdminGateway } from "@/components/admin-gateway";
import { AchievementDirectory, NewsDirectory, TeacherDirectory } from "@/components/content-directory";
import { SiteFooter, SiteHeader } from "@/components/site-shell";
import { copy, isLang, Lang, pillars, siteIdentity } from "@/lib/site-content";
import { loadPublishedContent, PublishedContent } from "@/lib/content-repository";

const validPages = ["home", "about", "academics", "teachers", "news", "achievements", "admissions", "contact", "legal", "privacy", "admin"];

export async function generateMetadata({ params }: { params: Promise<{ lang: string; slug?: string[] }> }): Promise<Metadata> {
  const { lang: rawLang, slug } = await params;
  if (!isLang(rawLang)) return {};
  const lang = rawLang as Lang;
  const page = slug?.[0] ?? "home";
  const detail = slug?.[1];
  const content = detail ? await loadPublishedContent() : null;
  if (detail && page === "teachers") {
    const item = content?.teachers.find((record) => record.slug === detail);
    if (item) return { title: item.name[lang], description: item.biography[lang] };
  }
  if (detail && page === "news") {
    const item = content?.news.find((record) => record.slug === detail);
    if (item) return { title: item.title[lang], description: item.excerpt[lang] };
  }
  if (detail && page === "achievements") {
    const item = content?.achievements.find((record) => record.slug === detail);
    if (item) return { title: item.title[lang], description: item.summary[lang] };
  }
  if (page === "home") return { title: copy[lang].home.title, description: copy[lang].home.intro };
  if (page === "admin") return { title: lang === "uz" ? "Kontent boshqaruvi" : "Content management", robots: { index: false, follow: false } };
  const pageCopy = copy[lang].pages[page as keyof typeof copy[typeof lang]["pages"]];
  return pageCopy ? { title: pageCopy.title, description: pageCopy.intro } : {};
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
      {detailSlug ? <DetailPage lang={lang} page={page} slug={detailSlug} content={content} /> : page === "home" ? <HomePage lang={lang} news={content.news} /> : page === "admin" ? <AdminPage lang={lang} /> : <InnerPage lang={lang} page={page} content={content} />}
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
      <section className="page-hero"><p className="eyebrow">{pageCopy.eyebrow}</p><h1>{pageCopy.title}</h1><p>{pageCopy.intro}</p></section>
      {page === "about" && <AboutContent lang={lang} />}
      {page === "academics" && <AcademicsContent lang={lang} />}
      {page === "teachers" && <TeachersContent lang={lang} items={content.teachers} />}
      {page === "news" && <NewsContent lang={lang} items={content.news} />}
      {page === "achievements" && <AchievementsContent lang={lang} items={content.achievements} />}
      {page === "admissions" && <AdmissionsContent lang={lang} />}
      {page === "contact" && <ContactContent lang={lang} />}
      {page === "legal" && <LegalContent lang={lang} />}
      {page === "privacy" && <PrivacyContent lang={lang} />}
    </main>
  );
}

function AboutContent({ lang }: { lang: Lang }) {
  const isUz = lang === "uz";
  const values = isUz
    ? [[Target, "Maqsad", "Maktabning tasdiqlangan missiyasi va o‘quvchilar oldidagi mas’uliyati."], [HeartHandshake, "Hamjamiyat", "O‘quvchi, oila va o‘qituvchi o‘rtasidagi hamkorlik."], [Sparkles, "Rivojlanish", "Bilim, xarakter va amaliy ko‘nikmalarni birgalikda rivojlantirish."]]
    : [[Target, "Purpose", "The school’s approved mission and responsibility to its students."], [HeartHandshake, "Community", "Partnership between students, families and teachers."], [Sparkles, "Growth", "Developing knowledge, character and practical skills together."]];
  return <section className="content-section page-content"><div className="split-panel"><div className="photo-placeholder tall"><Building2 size={46} /><span>{isUz ? "Hazorasp • Xorazm" : "Hazorasp • Khorezm"}</span><small>{isUz ? "Litsenziya № 531978" : "Licence № 531978"}</small></div><div><p className="eyebrow">{isUz ? "Maktab haqida" : "About the school"}</p><h2>{isUz ? "I–XI sinflar uchun ta’lim" : "Education for Grades 1–11"}</h2><p>{isUz ? '“IZZATBEK-EDU-GROUP” — Hazorasp tumanida faoliyat yurituvchi nodavlat ta’lim muassasasi. Maktab boshlang‘ich, tayanch o‘rta va o‘rta ta’lim xizmatlarini ko‘rsatish uchun litsenziyaga ega.' : '“IZZATBEK-EDU-GROUP” is a non-state educational institution operating in Hazorasp District. The school is licensed to provide primary, basic secondary and secondary education.'}</p><div className="director-card"><span>{isUz ? "Direktor" : "Director"}</span><strong>{siteIdentity.director}</strong></div></div></div><div className="value-grid">{values.map(([Icon, title, body]) => <article key={String(title)}><Icon /><h3>{title as string}</h3><p>{body as string}</p></article>)}</div></section>;
}

function AcademicsContent({ lang }: { lang: Lang }) {
  const isUz = lang === "uz";
  const items = isUz
    ? [[BookOpen, "Milliy o‘quv dasturi", "Ta’lim O‘zbekiston milliy o‘quv dasturi asosida olib boriladi."], [GraduationCap, "Boshlang‘ich ta’lim", "I–IV sinflar."], [Scale, "Tayanch o‘rta ta’lim", "V–IX sinflar."], [Sparkles, "O‘rta ta’lim", "X–XI sinflar."]]
    : [[BookOpen, "National curriculum", "Education is provided in accordance with Uzbekistan’s national curriculum."], [GraduationCap, "Primary education", "Grades 1–4."], [Scale, "Basic secondary education", "Grades 5–9."], [Sparkles, "Secondary education", "Grades 10–11."]];
  return <section className="content-section page-content"><div className="info-grid">{items.map(([Icon, title, body]) => <article key={String(title)}><Icon /><h2>{title as string}</h2><p>{body as string}</p><span>{copy[lang].sections.verifiedLater}</span></article>)}</div></section>;
}

function TeachersContent({ lang, items }: { lang: Lang; items: PublishedContent["teachers"] }) {
  return <section className="content-section page-content"><TeacherDirectory lang={lang} items={items} /></section>;
}

function NewsGrid({ lang, items, limit }: { lang: Lang; items: PublishedContent["news"]; limit?: number }) {
  return <NewsDirectory lang={lang} items={items} limit={limit} />;
}

function NewsContent({ lang, items }: { lang: Lang; items: PublishedContent["news"] }) { return <section className="content-section page-content"><NewsGrid lang={lang} items={items} /></section>; }

function AchievementsContent({ lang, items }: { lang: Lang; items: PublishedContent["achievements"] }) {
  const isUz = lang === "uz";
  return <section className="content-section page-content"><AchievementDirectory lang={lang} items={items} /><div className="process-grid"><article><strong>01</strong><h3>{isUz ? "Tekshirish" : "Verify"}</h3><p>{isUz ? "Natija va manba tasdiqlanadi." : "Confirm the result and source."}</p></article><article><strong>02</strong><h3>{isUz ? "Ruxsat" : "Permission"}</h3><p>{isUz ? "Shaxsiy ma’lumot va rasmga ruxsat olinadi." : "Obtain permission for personal data and imagery."}</p></article><article><strong>03</strong><h3>{isUz ? "Nashr" : "Publish"}</h3><p>{isUz ? "Ikki tilda ochiq va aniq e’lon qilinadi." : "Publish clearly in both languages."}</p></article></div></section>;
}

function AdmissionsContent({ lang }: { lang: Lang }) {
  const isUz = lang === "uz";
  const steps = isUz ? [["01", "Qo‘ng‘iroq qiling", "Qabul bo‘yicha maktabning rasmiy telefon raqamiga murojaat qiling."], ["02", "Maslahat oling", "Sinflar, mavjud joylar va kerakli hujjatlar haqida ma’lumot oling."], ["03", "Maktabga tashrif buyuring", "Keyingi qadamlar maktab ma’muriyati bilan kelishiladi."]] : [["01", "Call the school", "Contact the school through its official admissions telephone number."], ["02", "Receive a consultation", "Ask about grades, availability and required documents."], ["03", "Visit the school", "Agree the next steps directly with the school administration."]];
  return <section className="content-section page-content"><div className="process-grid">{steps.map(([n, title, body]) => <article key={n}><strong>{n}</strong><h2>{title}</h2><p>{body}</p></article>)}</div><div className="callout"><div><p className="eyebrow">{isUz ? "Ta’lim to‘lovi" : "Tuition"}</p><h2>{isUz ? "Ma’lumot individual maslahat davomida beriladi" : "Information is provided during an individual consultation"}</h2></div><Link className="button button-primary" href={`/${lang}/contact`}>{isUz ? "Bog‘lanish" : "Contact the school"}<ArrowRight size={18} /></Link></div></section>;
}

function ContactContent({ lang }: { lang: Lang }) {
  const isUz = lang === "uz";
  return <section className="content-section page-content"><div className="contact-details standalone"><article><MapPin /><div><h2>{isUz ? "Yuridik manzil" : "Legal address"}</h2><p>{siteIdentity.address}</p></div></article><article><Phone /><div><h2>{isUz ? "Telefon" : "Phone"}</h2><p>{siteIdentity.phone}</p></div></article><article><Mail /><div><h2>{isUz ? "Elektron pochta" : "Email"}</h2><a href={`mailto:${siteIdentity.email}`}>{siteIdentity.email}</a></div></article><a className="map-link-card" href={siteIdentity.mapsUrl} target="_blank" rel="noreferrer"><MapPin /><div><strong>{isUz ? "Google Maps’da ochish" : "Open in Google Maps"}</strong><span>{isUz ? "Maktab joylashuvini xaritada ko‘ring" : "View the school location on the map"}</span></div><ArrowRight size={20} /></a></div></section>;
}

function LegalContent({ lang }: { lang: Lang }) {
  const isUz = lang === "uz";
  const rows = [[isUz ? "Yuridik nom" : "Legal name", siteIdentity.legalName], [isUz ? "Tashkilot turi" : "Institution type", isUz ? "Nodavlat ta’lim muassasasi" : "Non-state educational institution"], [isUz ? "Litsenziya raqami" : "Licence number", siteIdentity.license], [isUz ? "Reyestr tartib raqami" : "Registry order number", siteIdentity.licenseOrder], [isUz ? "Amal qilish muddati" : "Validity", `${siteIdentity.licenseEffectiveFrom} — ${isUz ? "cheksiz" : "unlimited"}`], [isUz ? "Faoliyat turi" : "Licensed activity", siteIdentity.licensedActivity], [isUz ? "Litsenziyalangan sinflar" : "Licensed grades", siteIdentity.licensedGrades], [isUz ? "Vakolatli organ" : "Issuing authority", siteIdentity.licenseAuthority], [isUz ? "Yuridik manzil" : "Legal address", siteIdentity.address], [isUz ? "Ta’lim faoliyati manzillari" : "Licensed activity addresses", siteIdentity.activityAddresses.join("; ")], [isUz ? "Domen" : "Domain", siteIdentity.domain]];
  return <section className="content-section page-content"><div className="legal-warning"><ShieldCheck /><div><h2>{isUz ? "Tekshirilmagan da’volar e’lon qilinmaydi" : "Unverified claims will not be published"}</h2><p>{isUz ? "To‘liq litsenziya nusxasi imzo va shaxsiy ma’lumotlarni himoya qilish uchun avtomatik ravishda ommaga chiqarilmaydi." : "The complete licence scan will not be published automatically, protecting signatures and personal information."}</p></div></div><dl className="legal-list">{rows.map(([term, value]) => <div key={term}><dt>{term}</dt><dd>{value}</dd></div>)}</dl></section>;
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
    return <main><section className="page-hero compact"><p className="eyebrow">{teacher.role[lang]}</p><h1>{teacher.name[lang]}</h1><p>{teacher.biography[lang]}</p></section><section className="content-section page-content"><div className="profile-detail"><div className="teacher-avatar large">{teacher.imageUrl ? <img src={teacher.imageUrl} alt="" /> : teacher.initials}</div><div>{teacher.subjects[lang].length > 0 && <><h2>{lang === "uz" ? "O‘qitadigan fanlar" : "Subjects taught"}</h2><ul className="detail-list">{teacher.subjects[lang].map((item) => <li key={item}>{item}</li>)}</ul></>}<h2>{lang === "uz" ? "Malaka va tajriba" : "Qualifications and experience"}</h2>{teacher.qualifications[lang].length ? <ul className="detail-list">{teacher.qualifications[lang].map((item) => <li key={item}>{item}</li>)}</ul> : <p>{copy[lang].sections.verifiedLater}</p>}</div></div><Link className="text-link back-link" href={`/${lang}/teachers`}>← {lang === "uz" ? "Jamoaga qaytish" : "Back to the team"}</Link></section></main>;
  }
  if (page === "news") {
    const item = content.news.find((record) => record.slug === slug);
    if (!item) notFound();
    return <main><article className="article-detail"><p className="eyebrow">{item.date}</p><h1>{item.title[lang]}</h1><p className="article-lead">{item.excerpt[lang]}</p>{item.body[lang].map((paragraph) => <p key={paragraph}>{paragraph}</p>)}<Link className="text-link back-link" href={`/${lang}/news`}>← {lang === "uz" ? "Yangiliklarga qaytish" : "Back to news"}</Link></article></main>;
  }
  if (page === "achievements") {
    const item = content.achievements.find((record) => record.slug === slug);
    if (!item) notFound();
    return <main><article className="article-detail"><p className="eyebrow">{item.date}</p><h1>{item.title[lang]}</h1><p className="article-lead">{item.recipient[lang]}</p><p>{item.summary[lang]}</p><div className="legal-warning"><ShieldCheck /><div><h2>{lang === "uz" ? "Tasdiqlash manbasi" : "Verification source"}</h2><p>{item.source}</p></div></div><Link className="text-link back-link" href={`/${lang}/achievements`}>← {lang === "uz" ? "Yutuqlarga qaytish" : "Back to achievements"}</Link></article></main>;
  }
  notFound();
}

function AdminPage({ lang }: { lang: Lang }) {
  return <main><section className="page-hero compact"><p className="eyebrow">{lang === "uz" ? "Kontent boshqaruvi" : "Content management"}</p><h1>{lang === "uz" ? "Maktab kontentini xavfsiz boshqarish" : "Manage school content safely"}</h1><p>{lang === "uz" ? "Qoralamalar ommaga ko‘rinmaydi; faqat tasdiqlangan yozuvlar nashr qilinadi." : "Drafts remain private; only approved records are published."}</p></section><div className="admin-wrap"><AdminGateway lang={lang} /></div></main>;
}

export function generateStaticParams() { return [{ lang: "uz", slug: [] }, { lang: "en", slug: [] }]; }
