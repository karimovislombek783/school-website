import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AdminGateway } from "@/components/admin-gateway";
import { Lang } from "@/lib/site-content";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  return {
    title: lang === "uz" ? "Administrator | Izzatbek Edu Group" : "Administrator | Izzatbek Edu Group",
    robots: { index: false, follow: false },
  };
}

export default async function AdminPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: rawLang } = await params;
  if (rawLang !== "uz" && rawLang !== "en") notFound();
  const lang = rawLang as Lang;
  return <main>
    <section className="page-hero compact">
      <p className="eyebrow">{lang === "uz" ? "Kontent boshqaruvi" : "Content management"}</p>
      <h1>{lang === "uz" ? "Maktab kontentini xavfsiz boshqarish" : "Manage school content safely"}</h1>
      <p>{lang === "uz" ? "Qoralamalar ommaga ko‘rinmaydi; faqat tasdiqlangan yozuvlar nashr qilinadi." : "Drafts remain private; only approved records are published."}</p>
    </section>
    <div className="admin-wrap"><AdminGateway lang={lang} /></div>
  </main>;
}
