import { notFound } from "next/navigation";
import { NewsletterUnsubscribe } from "@/components/newsletter-signup";
import { SiteFooter, SiteHeader } from "@/components/site-shell";
import { isLang, Lang } from "@/lib/site-content";

export default async function UnsubscribePage({ params, searchParams }: { params: Promise<{ lang: string }>; searchParams: Promise<{ token?: string }> }) {
  const { lang: rawLang } = await params;
  if (!isLang(rawLang)) notFound();
  const lang = rawLang as Lang;
  const token = (await searchParams).token ?? "";
  return <div className="site-page"><SiteHeader lang={lang} current="newsletter" /><main id="main-content" className="newsletter-status-page"><NewsletterUnsubscribe lang={lang} token={token} /></main><SiteFooter lang={lang} /></div>;
}
