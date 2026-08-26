import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  ArrowRight, BookOpen, Building2, CheckCircle2,
  GraduationCap, HeartHandshake, Mail, MapPin, Phone,
  Scale, ShieldCheck, Sparkles, Target, Users,
} from "lucide-react";
import { AdminPreview } from "@/components/admin-preview";
import { AchievementDirectory, NewsDirectory, TeacherDirectory } from "@/components/content-directory";
import { ContactForm, NewsletterForm } from "@/components/preview-forms";
import { SiteFooter, SiteHeader } from "@/components/site-shell";
import { copy, isLang, Lang, pillars, publishedAchievements, publishedNews, publishedTeachers, siteIdentity } from "@/lib/site-content";

const validPages = ["home", "about", "academics", "teachers", "news", "achievements", "admissions", "contact", "legal", "privacy", "admin"];

export async function generateMetadata({ params }: { params: Promise<{ lang: string; slug?: string[] }> }): Promise<Metadata> {
  const { lang: rawLang, slug } = await params;
  if (!isLang(rawLang)) return {};
  const lang = rawLang as Lang;
  const page = slug?.[0] ?? "home";
  const detail = slug?.[1];
  if (detail && page === "teachers") {
    const item = publishedTeachers.find((record) => record.slug === detail);
    if (item) return { title: item.name[lang], description: item.biography[lang] };
  }
  if (detail && page === "news") {
    const item = publishedNews.find((record) => record.slug === detail);
    if (item) return { title: item.title[lang], description: item.excerpt[lang] };
  }
  if (detail && page === "achievements") {
    const item = publishedAchievements.find((record) => record.slug === detail);
    if (item) return { title: item.title[lang], description: item.summary[lang] };
  }
  if (page === "home") return { title: copy[lang].home.title, description: copy[lang].home.intro };
  if (page === "admin") return { title: lang === "uz" ? "Boshqaruv namunasi" : "Admin preview", robots: { index: false, follow: false } };
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
  return (
    <div className="site-page">
      <SiteHeader lang={lang} current={slug?.join("/") ?? page} />
      {detailSlug ? <DetailPage lang={lang} page={page} slug={detailSlug} /> : page === "home" ? <HomePage lang={lang} /> : page === "admin" ? <AdminPage lang={lang} /> : <InnerPage lang={lang} page={page} />}
      <SiteFooter lang={lang} />
    </div>
  );
}

function HomePage({ lang }: { lang: Lang }) {
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
          <div className="hero-trust"><ShieldCheck size={21} /><span>{t.sections.verifiedLater}</span></div>
        </div>
        <div className="hero-visual" role="img" aria-label={t.sections.placeholderPhoto}>
          <div className="photo-placeholder">
            <Building2 size={46} />
            <span>{t.sections.placeholderPhoto}</span>
            <small>16:10 landscape image</small>
          </div>
          <div className="hero-note"><span>{t.home.trustLabel}</span><strong>{siteIdentity.license}</strong></div>
        </div>
      </section>

      <section className="trust-section">
        <div><p className="eyebrow">{t.home.trustLabel}</p><h2>{t.home.trustTitle}</h2></div>
        <p>{t.home.trustBody}</p>
        <Link className="text-link" href={`/${lang}/legal`}>{t.sections.learnMore}<ArrowRight size={17} /></Link>
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

      <section className="content-section soft-section">
        <div className="section-heading"><div><p className="eyebrow">{t.nav.news}</p><h2>{t.home.latestTitle}</h2></div><p>{t.home.latestIntro}</p></div>
        <NewsGrid lang={lang} limit={3} />
        <Link className="text-link section-link" href={`/${lang}/news`}>{t.sections.viewAll}<ArrowRight size={17} /></Link>
      </section>

      <section className="newsletter-section">
        <div><p className="eyebrow">Newsletter</p><h2>{t.home.newsletterTitle}</h2><p>{t.home.newsletterBody}</p></div>
        <NewsletterForm lang={lang} />
      </section>
    </main>
  );
}

function InnerPage({ lang, page }: { lang: Lang; page: string }) {
  const t = copy[lang];
  const pageCopy = t.pages[page as keyof typeof t.pages];
  if (!pageCopy) notFound();
  return (
    <main>
      <section className="page-hero"><p className="eyebrow">{pageCopy.eyebrow}</p><h1>{pageCopy.title}</h1><p>{pageCopy.intro}</p></section>
      {page === "about" && <AboutContent lang={lang} />}
      {page === "academics" && <AcademicsContent lang={lang} />}
      {page === "teachers" && <TeachersContent lang={lang} />}
      {page === "news" && <NewsContent lang={lang} />}
      {page === "achievements" && <AchievementsContent lang={lang} />}
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
  return <section className="content-section page-content"><div className="split-panel"><div className="photo-placeholder tall"><Building2 size={46} /><span>{isUz ? "Tasdiqlangan kampus fotosurati" : "Approved campus photograph"}</span></div><div><p className="eyebrow">{isUz ? "Maktab tarixi" : "Our story"}</p><h2>{isUz ? "Tasdiqlangan tarix uchun tayyor tuzilma" : "A clear structure for the verified school story"}</h2><p>{isUz ? "Tashkil topgan yil, ta’lim faoliyatining boshlanishi, o‘sish bosqichlari va hududga xizmat qilish tarixi maktab rahbariyati tasdiqlagach shu yerda bo‘ladi." : "The establishment year, start of educational activity, development milestones and service to the local community will appear here after leadership approval."}</p></div></div><div className="value-grid">{values.map(([Icon, title, body]) => <article key={String(title)}><Icon /><h3>{title as string}</h3><p>{body as string}</p></article>)}</div></section>;
}

function AcademicsContent({ lang }: { lang: Lang }) {
  const isUz = lang === "uz";
  const items = isUz
    ? [[BookOpen, "O‘quv dasturi", "Davlat tomonidan tan olingan o‘quv dasturi haqidagi tasdiqlangan ma’lumot."], [GraduationCap, "Sinflar", "Maktab ta’lim beradigan sinflar va bosqichlar."], [Scale, "Baholash", "O‘quv natijalarini baholash va ota-onalarga xabar berish tartibi."], [Sparkles, "Qo‘shimcha imkoniyatlar", "To‘garaklar, olimpiadalar, musobaqalar va rivojlanish dasturlari."]]
    : [[BookOpen, "Curriculum", "Verified information about the nationally recognised curriculum."], [GraduationCap, "Grade levels", "The grades and educational stages formally provided by the school."], [Scale, "Assessment", "How learning outcomes are evaluated and communicated to families."], [Sparkles, "Additional opportunities", "Clubs, olympiads, competitions and development programmes."]];
  return <section className="content-section page-content"><div className="info-grid">{items.map(([Icon, title, body]) => <article key={String(title)}><Icon /><h2>{title as string}</h2><p>{body as string}</p><span>{copy[lang].sections.verifiedLater}</span></article>)}</div></section>;
}

function TeachersContent({ lang }: { lang: Lang }) {
  return <section className="content-section page-content"><TeacherDirectory lang={lang} items={publishedTeachers} /></section>;
}

function NewsGrid({ lang, limit }: { lang: Lang; limit?: number }) {
  return <NewsDirectory lang={lang} items={publishedNews} limit={limit} />;
}

function NewsContent({ lang }: { lang: Lang }) { return <section className="content-section page-content"><NewsGrid lang={lang} /></section>; }

function AchievementsContent({ lang }: { lang: Lang }) {
  const isUz = lang === "uz";
  return <section className="content-section page-content"><AchievementDirectory lang={lang} items={publishedAchievements} /><div className="process-grid"><article><strong>01</strong><h3>{isUz ? "Tekshirish" : "Verify"}</h3><p>{isUz ? "Natija va manba tasdiqlanadi." : "Confirm the result and source."}</p></article><article><strong>02</strong><h3>{isUz ? "Ruxsat" : "Permission"}</h3><p>{isUz ? "Shaxsiy ma’lumot va rasmga ruxsat olinadi." : "Obtain permission for personal data and imagery."}</p></article><article><strong>03</strong><h3>{isUz ? "Nashr" : "Publish"}</h3><p>{isUz ? "Ikki tilda ochiq va aniq e’lon qilinadi." : "Publish clearly in both languages."}</p></article></div></section>;
}

function AdmissionsContent({ lang }: { lang: Lang }) {
  const isUz = lang === "uz";
  const steps = isUz ? [["01", "Bog‘lanish", "Qabul bo‘yicha rasmiy aloqa kanaliga murojaat qiling."], ["02", "Ma’lumot olish", "Sinflar, joylar va zarur hujjatlar haqidagi tasdiqlangan ma’lumotni oling."], ["03", "Ariza", "Maktab belgilagan tartibda hujjatlarni taqdim eting."]] : [["01", "Enquire", "Contact the school through its official admissions channel."], ["02", "Get information", "Receive verified information about grades, availability and required documents."], ["03", "Apply", "Submit documents according to the school’s approved process."]];
  return <section className="content-section page-content"><div className="process-grid">{steps.map(([n, title, body]) => <article key={n}><strong>{n}</strong><h2>{title}</h2><p>{body}</p></article>)}</div><div className="callout"><div><p className="eyebrow">{isUz ? "Qabul ma’lumoti" : "Admissions information"}</p><h2>{isUz ? "Ma’lumot tasdiqlangach e’lon qilinadi" : "Details will be published after approval"}</h2></div><Link className="button button-primary" href={`/${lang}/contact`}>{isUz ? "Bog‘lanish" : "Contact the school"}<ArrowRight size={18} /></Link></div></section>;
}

function ContactContent({ lang }: { lang: Lang }) {
  const isUz = lang === "uz";
  return <section className="content-section page-content"><div className="contact-layout"><div className="contact-details"><article><MapPin /><div><h2>{isUz ? "Manzil" : "Address"}</h2><p>{siteIdentity.address}</p></div></article><article><Phone /><div><h2>{isUz ? "Telefon" : "Phone"}</h2><p>{siteIdentity.phone}</p></div></article><article><Mail /><div><h2>{isUz ? "Elektron pochta" : "Email"}</h2><p>{siteIdentity.email}</p></div></article><div className="map-placeholder"><MapPin /><span>{isUz ? "Tasdiqlangan xarita joylashuvi" : "Verified map location"}</span></div></div><ContactForm lang={lang} /></div></section>;
}

function LegalContent({ lang }: { lang: Lang }) {
  const isUz = lang === "uz";
  const rows = [[isUz ? "Yuridik nom" : "Legal name", siteIdentity.legalName], [isUz ? "Tashkilot turi" : "Institution type", isUz ? "[Rasmiy K–12 ta’lim muassasasi — tasdiqlanadi]" : "[Formal K–12 educational institution — to be verified]"], [isUz ? "Litsenziya" : "Licence", siteIdentity.license], [isUz ? "Manzil" : "Address", siteIdentity.address], [isUz ? "Domen" : "Domain", siteIdentity.domain]];
  return <section className="content-section page-content"><div className="legal-warning"><ShieldCheck /><div><h2>{isUz ? "Tekshirilmagan da’volar e’lon qilinmaydi" : "Unverified claims will not be published"}</h2><p>{isUz ? "To‘liq litsenziya nusxasi imzo va shaxsiy ma’lumotlarni himoya qilish uchun avtomatik ravishda ommaga chiqarilmaydi." : "The complete licence scan will not be published automatically, protecting signatures and personal information."}</p></div></div><dl className="legal-list">{rows.map(([term, value]) => <div key={term}><dt>{term}</dt><dd>{value}</dd></div>)}</dl></section>;
}

function PrivacyContent({ lang }: { lang: Lang }) {
  const isUz = lang === "uz";
  const items = isUz ? [["Formalar", "Aloqa va obuna ma’lumotlari faqat ko‘rsatilgan maqsad uchun ishlatiladi."], ["Fotosuratlar", "O‘quvchilar va xodimlar suratlari faqat tegishli ruxsat bilan e’lon qilinadi."], ["Tanlov", "Obunani istalgan vaqtda bekor qilish va ma’lumotni tuzatishni so‘rash mumkin."], ["Xavfsizlik", "Administrator huquqlari vazifaga qarab cheklanadi va muhim harakatlar qayd etiladi."]] : [["Forms", "Contact and subscription data is used only for the stated purpose."], ["Photography", "Images of students and staff are published only with appropriate permission."], ["Choice", "Subscribers can unsubscribe and people may request correction of their information."], ["Security", "Administrative access is limited by role and important actions are recorded."]];
  return <section className="content-section page-content"><div className="info-grid">{items.map(([title, body], i) => { const Icon = [Mail, Users, CheckCircle2, ShieldCheck][i]; return <article key={title}><Icon /><h2>{title}</h2><p>{body}</p></article>; })}</div></section>;
}

function DetailPage({ lang, page, slug }: { lang: Lang; page: string; slug: string }) {
  if (page === "teachers") {
    const teacher = publishedTeachers.find((item) => item.slug === slug);
    if (!teacher) notFound();
    return <main><section className="page-hero compact"><p className="eyebrow">{teacher.role[lang]}</p><h1>{teacher.name[lang]}</h1><p>{teacher.biography[lang]}</p></section><section className="content-section page-content"><div className="profile-detail"><div className="teacher-avatar large">{teacher.initials}</div><div><h2>{lang === "uz" ? "Malaka va tajriba" : "Qualifications and experience"}</h2>{teacher.qualifications[lang].length ? <ul className="detail-list">{teacher.qualifications[lang].map((item) => <li key={item}>{item}</li>)}</ul> : <p>{copy[lang].sections.verifiedLater}</p>}</div></div><Link className="text-link back-link" href={`/${lang}/teachers`}>← {lang === "uz" ? "Jamoaga qaytish" : "Back to the team"}</Link></section></main>;
  }
  if (page === "news") {
    const item = publishedNews.find((record) => record.slug === slug);
    if (!item) notFound();
    return <main><article className="article-detail"><p className="eyebrow">{item.date}</p><h1>{item.title[lang]}</h1><p className="article-lead">{item.excerpt[lang]}</p>{item.body[lang].map((paragraph) => <p key={paragraph}>{paragraph}</p>)}<Link className="text-link back-link" href={`/${lang}/news`}>← {lang === "uz" ? "Yangiliklarga qaytish" : "Back to news"}</Link></article></main>;
  }
  if (page === "achievements") {
    const item = publishedAchievements.find((record) => record.slug === slug);
    if (!item) notFound();
    return <main><article className="article-detail"><p className="eyebrow">{item.date}</p><h1>{item.title[lang]}</h1><p className="article-lead">{item.recipient[lang]}</p><p>{item.summary[lang]}</p><div className="legal-warning"><ShieldCheck /><div><h2>{lang === "uz" ? "Tasdiqlash manbasi" : "Verification source"}</h2><p>{item.source}</p></div></div><Link className="text-link back-link" href={`/${lang}/achievements`}>← {lang === "uz" ? "Yutuqlarga qaytish" : "Back to achievements"}</Link></article></main>;
  }
  notFound();
}

function AdminPage({ lang }: { lang: Lang }) {
  return <main><section className="page-hero compact"><p className="eyebrow">CMS preview</p><h1>{lang === "uz" ? "Maktab kontentini xavfsiz boshqarish" : "Manage school content safely"}</h1><p>{lang === "uz" ? "Quyidagi panel yakuniy ish jarayonining interaktiv namunasidir." : "The panel below is an interactive preview of the intended workflow."}</p></section><div className="admin-wrap"><AdminPreview lang={lang} /></div></main>;
}

export function generateStaticParams() { return [{ lang: "uz", slug: [] }, { lang: "en", slug: [] }]; }
