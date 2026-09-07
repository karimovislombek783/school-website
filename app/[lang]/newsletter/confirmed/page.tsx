import Link from "next/link";
import { CheckCircle2, CircleAlert } from "lucide-react";
import { notFound } from "next/navigation";
import { SiteFooter, SiteHeader } from "@/components/site-shell";
import { isLang, Lang } from "@/lib/site-content";

export default async function ConfirmedPage({ params, searchParams }: { params: Promise<{ lang: string }>; searchParams: Promise<{ status?: string }> }) {
  const { lang: rawLang } = await params;
  if (!isLang(rawLang)) notFound();
  const lang = rawLang as Lang;
  const confirmed = (await searchParams).status === "confirmed";
  return <div className="site-page"><SiteHeader lang={lang} current="newsletter" /><main id="main-content" className="newsletter-status-page"><div className="newsletter-status-card">{confirmed ? <CheckCircle2 /> : <CircleAlert />}<h1>{confirmed ? (lang === "uz" ? "Obuna tasdiqlandi" : "Subscription confirmed") : (lang === "uz" ? "Havola yaroqsiz" : "Invalid confirmation link")}</h1><p>{confirmed ? (lang === "uz" ? "Endi tasdiqlangan maktab yangiliklari emailingizga yuboriladi." : "Approved school news will now be delivered to your email.") : (lang === "uz" ? "Bu tasdiqlash havolasi yaroqsiz yoki avval ishlatilgan." : "This confirmation link is invalid or has already been used.")}</p><Link className="button button-primary" href={`/${lang}`}>{lang === "uz" ? "Bosh sahifaga qaytish" : "Return home"}</Link></div></main><SiteFooter lang={lang} /></div>;
}
