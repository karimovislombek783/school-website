// Optional achievement details use the existing achievement body field so older
// records and installations remain readable without a database migration.
export type AchievementDetails = { kind: "achievement-details-v1"; grade?: number; level?: string; typeUz?: string; typeEn?: string; resultUz?: string; resultEn?: string; previousBody?: string };
export const competitionLevels = ["school", "district", "regional", "national", "international"] as const;
export function readAchievementDetails(body?: string | null): AchievementDetails {
  try { const value = JSON.parse(body || "null"); if (value?.kind === "achievement-details-v1") return value; } catch { /* Legacy prose is not metadata. */ }
  return { kind: "achievement-details-v1" };
}
export function writeAchievementDetails(body: string | null | undefined, values: Omit<AchievementDetails, "kind" | "previousBody">): string {
  const prior = readAchievementDetails(body);
  const grade = Number(values.grade);
  return JSON.stringify({ ...prior, ...values, kind: "achievement-details-v1", grade: Number.isInteger(grade) && grade >= 1 && grade <= 11 ? grade : undefined, level: competitionLevels.includes(values.level as typeof competitionLevels[number]) ? values.level : undefined, previousBody: prior.previousBody ?? (body && prior.kind && !body.includes('"achievement-details-v1"') ? body : undefined) });
}
export function canonicalStudentName(name: string): string {
  const value = name.trim().replace(/\s+/g, " ");
  return /^karimov islombek$/i.test(value) || /^islombek karimov$/i.test(value) ? "Islombek Karimov" : value;
}
export function competitionLevelLabel(level: string, lang: "uz" | "en"): string {
  const labels: Record<string, [string, string]> = { school: ["Maktab bosqichi", "School level"], district: ["Tuman bosqichi", "District level"], regional: ["Viloyat bosqichi", "Regional level"], national: ["Respublika bosqichi", "National level"], international: ["Xalqaro bosqich", "International level"] };
  return labels[level]?.[lang === "uz" ? 0 : 1] ?? level;
}
export function localizeCredential(value: string, lang: "uz" | "en", category?: string, subject?: string): string {
  if (/^(milliy sertifikat|national certificate)$/i.test(value.trim())) return lang === "uz" ? "Milliy sertifikat" : "National certificate";
  const pairs = [["English Olympiad", "Ingliz tili olimpiadasi"], ["Math Olympiad", "Matematika olimpiadasi"], ["Mathematics Olympiad", "Matematika olimpiadasi"], ["Chemistry Olympiad", "Kimyo olimpiadasi"], ["Foundations of State and Law Olympiad", "Davlat va huquq asoslari olimpiadasi"]];
  for (const [en, uz] of pairs) if ([en.toLowerCase(), uz.toLowerCase()].includes(value.trim().toLowerCase())) return lang === "uz" ? uz : en;
  // Preserve an unknown competition's official name; editors can supply both languages.
  return value;
}
export function localizeResult(value: string, lang: "uz" | "en"): string {
  const s = value.trim();
  const ranks = [ [/^(first place|1st place|1\s*[-–]?\s*o[‘’']rin)$/i, "1-o‘rin", "1st place"], [/^(second place|2nd place|2\s*[-–]?\s*o[‘’']rin)$/i, "2-o‘rin", "2nd place"], [/^(third place|3rd place|3\s*[-–]?\s*o[‘’']rin)$/i, "3-o‘rin", "3rd place"] ] as const;
  for (const [pattern, uz, en] of ranks) if (pattern.test(s)) return lang === "uz" ? uz : en;
  const medals = [["gold medal", "Oltin medal"], ["silver medal", "Kumush medal"], ["bronze medal", "Bronza medal"]];
  for (const [en, uz] of medals) if ([en.toLowerCase(), uz.toLowerCase()].includes(s.toLowerCase())) return lang === "uz" ? uz : en;
  return s;
}
