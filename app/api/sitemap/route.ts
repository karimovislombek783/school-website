import { loadPublishedContent } from "@/lib/content-repository";
import { siteIdentity } from "@/lib/site-content";

export const revalidate = 3600;

function escapeXml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;",
  })[character] ?? character);
}

export async function GET() {
  const origin = siteIdentity.siteUrl;
  const staticPages = ["", "about", "academics", "teachers", "news", "achievements", "admissions", "contact", "legal", "privacy", "policies"];
  const content = await loadPublishedContent();
  const dynamic = [
    ...content.teachers.map((item) => `teachers/${item.slug}`),
    ...content.news.map((item) => `news/${item.slug}`),
    ...content.achievements.map((item) => `achievements/${item.slug}`),
  ];
  const paths = [...staticPages, ...dynamic];
  const entries = paths.flatMap((path) => (["uz", "en"] as const).map((lang) => {
    const suffix = path ? `/${path}` : "";
    const url = `${origin}/${lang}${suffix}`;
    return `  <url>\n    <loc>${escapeXml(url)}</loc>\n    <xhtml:link rel="alternate" hreflang="uz" href="${escapeXml(`${origin}/uz${suffix}`)}" />\n    <xhtml:link rel="alternate" hreflang="en" href="${escapeXml(`${origin}/en${suffix}`)}" />\n    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(`${origin}/uz${suffix}`)}" />\n  </url>`;
  }));
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${entries.join("\n")}\n</urlset>`;
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
}
