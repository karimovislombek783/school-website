import { createClient } from "@supabase/supabase-js";
import { AchievementRecord, NewsRecord, publishedAchievements, publishedNews, publishedTeachers, TeacherRecord } from "@/lib/site-content";

type ContentRow = {
  id: string; type: "teacher" | "news" | "achievement"; slug: string; status: "draft" | "published";
  title_uz: string; title_en: string; summary_uz: string; summary_en: string; body_uz: string | null; body_en: string | null;
  category: string | null; department: string | null; event_date: string | null; recipient_uz: string | null; recipient_en: string | null; source_url: string | null; image_path: string | null;
};

export type PublishedContent = { teachers: TeacherRecord[]; news: NewsRecord[]; achievements: AchievementRecord[] };

export async function loadPublishedContent(): Promise<PublishedContent> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return { teachers: publishedTeachers, news: publishedNews, achievements: publishedAchievements };
  const client = createClient(url, key, { auth: { persistSession: false } });
  const { data, error } = await client.from("content_items").select("*").eq("status", "published").order("published_at", { ascending: false });
  if (error || !data) return { teachers: [], news: [], achievements: [] };
  const rows = await Promise.all((data as ContentRow[]).map(async (row) => {
    if (!row.image_path) return { ...row, image_url: undefined };
    const { data: signed } = await client.storage.from("school-media").createSignedUrl(row.image_path, 3600);
    return { ...row, image_url: signed?.signedUrl };
  }));
  return {
    teachers: rows.filter((row) => row.type === "teacher").map((row) => ({ slug: row.slug, status: "published", department: validDepartment(row.department), name: { uz: row.title_uz, en: row.title_en }, role: { uz: row.recipient_uz ?? "", en: row.recipient_en ?? "" }, biography: { uz: row.summary_uz, en: row.summary_en }, qualifications: { uz: splitBody(row.body_uz), en: splitBody(row.body_en) }, initials: initials(row.title_uz), imageUrl: row.image_url })),
    news: rows.filter((row) => row.type === "news").map((row) => ({ slug: row.slug, status: "published", category: row.category === "announcement" ? "announcement" : "news", date: row.event_date ?? "", title: { uz: row.title_uz, en: row.title_en }, excerpt: { uz: row.summary_uz, en: row.summary_en }, body: { uz: splitBody(row.body_uz), en: splitBody(row.body_en) }, imageUrl: row.image_url })),
    achievements: rows.filter((row) => row.type === "achievement").map((row) => ({ slug: row.slug, status: "published", date: row.event_date ?? "", title: { uz: row.title_uz, en: row.title_en }, recipient: { uz: row.recipient_uz ?? "", en: row.recipient_en ?? "" }, summary: { uz: row.summary_uz, en: row.summary_en }, source: row.source_url ?? "", imageUrl: row.image_url })),
  };
}

function splitBody(value: string | null) { return value ? value.split(/\n\s*\n/).map((item) => item.trim()).filter(Boolean) : []; }
function initials(value: string) { return value.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase(); }
function validDepartment(value: string | null): TeacherRecord["department"] { return ["leadership", "stem", "languages", "social-sciences"].includes(value ?? "") ? value as TeacherRecord["department"] : "social-sciences"; }
