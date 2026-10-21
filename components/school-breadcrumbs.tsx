import Link from "next/link";
import { copy, Lang, siteIdentity } from "@/lib/site-content";
import styles from "./school-breadcrumbs.module.css";

export function SchoolBreadcrumbs({ lang, page, label, detail }: { lang: Lang; page: string; label: string; detail?: { slug: string; label: string } }) {
  const items = [
    { name: copy[lang].nav.home, path: `/${lang}` },
    { name: label, path: `/${lang}/${page}` },
    ...(detail ? [{ name: detail.label, path: `/${lang}/${page}/${encodeURIComponent(detail.slug)}` }] : []),
  ];
  const schema = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: items.map((item, index) => ({ "@type": "ListItem", position: index + 1, name: item.name, item: new URL(item.path, siteIdentity.siteUrl).href })) };
  return <>
    <nav className={styles.breadcrumbs} aria-label={lang === "uz" ? "Sahifa yo‘li" : "Breadcrumb"}><ol>{items.map((item, index) => <li key={item.path}>{index === items.length - 1 ? <span aria-current="page">{item.name}</span> : <Link href={item.path}>{item.name}</Link>}</li>)}</ol></nav>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema).replace(/</g, "\\u003c") }} />
  </>;
}
