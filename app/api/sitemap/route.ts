import { loadPublishedContent } from "@/lib/content-repository";
import { siteIdentity } from "@/lib/site-content";

export const revalidate = 300;

export async function GET() {
  const origin = `https://${siteIdentity.domain}`;
  const staticPages = ["", "about", "academics", "teachers", "news", "achievements", "admissions", "contact", "legal", "privacy", "policies"];
  const content = await loadPublishedContent();
  const dynamic = [
    ...content.teachers.map((item) => `teachers/${item.slug}`),
    ...content.news.map((item) => `news/${item.slug}`),
    ...content.achievements.map((item) => `achievements/${item.slug}`),
  ];
  const urls = (["uz", "en"] as const).flatMap((lang) => [...staticPages, ...dynamic].map((path) => `${origin}/${lang}${path ? `/${path}` : ""}`));
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((url) => `  <url><loc>${url}</loc></url>`).join("\n")}\n</urlset>`;
  return new Response(xml, { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } });
}
