import type { Lang } from "@/lib/site-content";

export const publicationCategories = [
  ["school-news", "Maktab yangiliklari", "School News"],
  ["announcements", "E’lonlar", "Announcements"],
  ["student-life", "O‘quvchilar hayoti", "Student Life"],
  ["student-voices", "O‘quvchilar ovozi", "Student Voices"],
  ["academic-corner", "Akademik burchak", "Academic Corner"],
  ["achievements", "Yutuqlar", "Achievements"],
  ["community", "Hamjamiyat", "Community"],
  ["arts-culture", "San’at va madaniyat", "Arts & Culture"],
  ["sports", "Sport", "Sports"],
  ["editorial", "Tahririyat fikri", "Editorial"],
] as const;

export const publicationFormats = [
  ["news-report", "Yangilik xabari", "News report"],
  ["feature", "Maxsus maqola", "Feature story"],
  ["interview", "Intervyu", "Interview"],
  ["opinion", "Fikr-mulohaza", "Opinion"],
  ["photo-essay", "Fotohikoya", "Photo essay"],
  ["announcement", "E’lon", "Announcement"],
] as const;

export type PublicationCategory = typeof publicationCategories[number][0];
export type PublicationFormat = typeof publicationFormats[number][0];

export function publicationCategoryLabel(value: string, lang: Lang) {
  const item = publicationCategories.find(([key]) => key === value) ?? publicationCategories[0];
  return lang === "uz" ? item[1] : item[2];
}

export function publicationFormatLabel(value: string, lang: Lang) {
  const item = publicationFormats.find(([key]) => key === value) ?? publicationFormats[0];
  return lang === "uz" ? item[1] : item[2];
}
