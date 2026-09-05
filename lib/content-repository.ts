import { createClient } from "@supabase/supabase-js";
import { AchievementRecord, NewsRecord, publishedAchievements, publishedNews, publishedTeachers, TeacherDepartment, TeacherRecord, TeacherRelatedLink } from "@/lib/site-content";

type ContentRow = {
  id: string; type: "teacher" | "news" | "achievement"; slug: string; status: "draft" | "published";
  title_uz: string; title_en: string; summary_uz: string; summary_en: string; body_uz: string | null; body_en: string | null;
  category: string | null; departments: string[] | null; subjects_uz: string[] | null; subjects_en: string[] | null; is_leadership: boolean | null; event_date: string | null; recipient_uz: string | null; recipient_en: string | null; source_url: string | null; image_path: string | null;
  teacher_email: string | null; show_teacher_email: boolean | null; cv_url: string | null; related_links: unknown;
  gallery_paths: string[] | null;
};

export type PublishedContent = { teachers: TeacherRecord[]; news: NewsRecord[]; achievements: AchievementRecord[] };

export async function loadPublishedContent(): Promise<PublishedContent> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return { teachers: publishedTeachers, news: publishedNews, achievements: publishedAchievements };
  const client = createClient(url, key, { auth: { persistSession: false } });
  const baseFields = "id,type,slug,status,title_uz,title_en,summary_uz,summary_en,body_uz,body_en,category,departments,subjects_uz,subjects_en,is_leadership,event_date,recipient_uz,recipient_en,source_url,image_path";
  const enrichedQuery = await client.from("content_items").select(`${baseFields},teacher_email,show_teacher_email,cv_url,related_links,gallery_paths`).eq("status", "published").order("published_at", { ascending: false });
  let data: unknown[] | null = enrichedQuery.data;
  let error = enrichedQuery.error;
  // Keep the current public site working while the additive migration is being applied.
  if (error?.code === "42703") {
    const legacyQuery = await client.from("content_items").select(baseFields).eq("status", "published").order("published_at", { ascending: false });
    data = legacyQuery.data;
    error = legacyQuery.error;
  }
  if (error || !data) return { teachers: [], news: [], achievements: [] };
  const rows = await Promise.all((data as Partial<ContentRow>[]).map(async (partial) => {
    const row = { teacher_email: null, show_teacher_email: false, cv_url: null, related_links: [], gallery_paths: [], ...partial } as ContentRow;
    const paths = [row.image_path, ...(row.gallery_paths ?? []).slice(0, 8)].filter((path): path is string => Boolean(path));
    const signedUrls = paths.length ? (await client.storage.from("school-media").createSignedUrls(paths, 86400)).data ?? [] : [];
    // Supabase preserves request order, while `path` can be absent from an
    // individual response. Indexing first prevents a valid cover from being
    // lost just because response metadata is incomplete.
    const urlByPath = new Map<string, string>();
    signedUrls.forEach((item, index) => {
      if (item.signedUrl && paths[index]) urlByPath.set(paths[index], item.signedUrl);
      if (item.signedUrl && item.path) urlByPath.set(item.path, item.signedUrl);
    });
    const galleryPaths = (row.gallery_paths ?? []).slice(0, 8);
    const storedCoverUrl = row.image_path ? urlByPath.get(row.image_path) : undefined;
    const fallbackCoverPath = row.type === "news" && !storedCoverUrl
      ? galleryPaths.find((path) => urlByPath.has(path)) ?? null
      : null;
    const coverUrl = storedCoverUrl ?? (fallbackCoverPath ? urlByPath.get(fallbackCoverPath) : undefined);
    const visibleGalleryPaths = fallbackCoverPath ? galleryPaths.filter((path) => path !== fallbackCoverPath) : galleryPaths;
    return {
      ...row,
      image_url: coverUrl,
      gallery_urls: visibleGalleryPaths.flatMap((path) => {
        const signedUrl = urlByPath.get(path);
        return signedUrl ? [signedUrl] : [];
      }),
    };
  }));
  return {
    teachers: rows.filter((row) => row.type === "teacher").map((row) => ({ slug: row.slug, status: "published", departments: validDepartments(row.departments), isLeadership: Boolean(row.is_leadership), subjects: { uz: cleanList(row.subjects_uz), en: cleanList(row.subjects_en) }, name: { uz: row.title_uz, en: row.title_en }, role: { uz: row.recipient_uz ?? "", en: row.recipient_en ?? "" }, biography: { uz: row.summary_uz, en: row.summary_en }, qualifications: { uz: splitBody(row.body_uz), en: splitBody(row.body_en) }, initials: initials(row.title_uz), imageUrl: row.image_url, email: row.show_teacher_email ? cleanEmail(row.teacher_email) : undefined, cvUrl: cleanHttpsUrl(row.cv_url), relatedLinks: cleanRelatedLinks(row.related_links) })),
    news: rows.filter((row) => row.type === "news").map((row) => ({ slug: row.slug, status: "published", category: row.category === "announcement" ? "announcement" : "news", date: row.event_date ?? "", title: { uz: row.title_uz, en: row.title_en }, excerpt: { uz: row.summary_uz, en: row.summary_en }, body: { uz: splitBody(row.body_uz), en: splitBody(row.body_en) }, imageUrl: row.image_url, galleryUrls: row.gallery_urls ?? [] })),
    achievements: rows.filter((row) => row.type === "achievement").map((row) => ({ slug: row.slug, status: "published", date: row.event_date ?? "", title: { uz: row.title_uz, en: row.title_en }, recipient: { uz: row.recipient_uz ?? "", en: row.recipient_en ?? "" }, summary: { uz: row.summary_uz, en: row.summary_en }, source: row.source_url ?? "", imageUrl: row.image_url })),
  };
}

function splitBody(value: string | null) { return value ? value.split(/\n\s*\n/).map((item) => item.trim()).filter(Boolean) : []; }
function initials(value: string) { return value.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase(); }
const teacherDepartments: TeacherDepartment[] = ["stem", "languages", "social-sciences", "primary", "arts-pe", "student-support"];
function validDepartments(values: string[] | null): TeacherDepartment[] { return (values ?? []).filter((value): value is TeacherDepartment => teacherDepartments.includes(value as TeacherDepartment)); }
function cleanList(values: string[] | null) { return (values ?? []).map((value) => value.trim()).filter(Boolean); }
function cleanEmail(value: string | null) { return value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? value : undefined; }
function cleanHttpsUrl(value: string | null) { try { if (!value) return undefined; const url = new URL(value); return url.protocol === "https:" ? url.toString() : undefined; } catch { return undefined; } }
function cleanRelatedLinks(value: unknown): TeacherRelatedLink[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 8).flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const candidate = item as Record<string, unknown>;
    const url = cleanHttpsUrl(typeof candidate.url === "string" ? candidate.url : null);
    const uz = typeof candidate.label_uz === "string" ? candidate.label_uz.trim() : "";
    const en = typeof candidate.label_en === "string" ? candidate.label_en.trim() : "";
    return url && (uz || en) ? [{ url, label: { uz: uz || en, en: en || uz } }] : [];
  });
}
