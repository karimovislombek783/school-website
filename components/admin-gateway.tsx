import { AdminConsole, AdminHealth, AdminRecord, AuditRecord, RevisionRecord } from "@/components/admin-console";
import { AdminLogin, AdminSignOut } from "@/components/admin-auth";
import { AdminMfa } from "@/components/admin-mfa";
import { LanguageSwitch } from "@/components/language-switch";
import { Lang } from "@/lib/site-content";
import { createServerSupabase, isSupabaseConfigured } from "@/lib/supabase/server";
import { connection } from "next/server";
import { PublicationAuthor } from "@/components/writer-manager";

export async function AdminGateway({ lang }: { lang: Lang }) {
  if (!isSupabaseConfigured()) return <section className="admin-setup"><h2>{lang === "uz" ? "Xavfsiz CMS ulanishga tayyor" : "Secure CMS ready to connect"}</h2><p>{lang === "uz" ? "Maktab uchun alohida Supabase loyihasi hali ulanmagan. Shu sababli tizim hech qanday ma’lumot saqlamaydi va soxta administrator kirishini ko‘rsatmaydi." : "A separate school Supabase project has not been connected, so the system stores nothing and does not pretend that administrator access is active."}</p><ol><li>{lang === "uz" ? "Alohida maktab Supabase loyihasini yarating." : "Create a separate school Supabase project."}</li><li>{lang === "uz" ? "supabase/schema.sql faylini ishga tushiring." : "Run supabase/schema.sql."}</li><li>{lang === "uz" ? "docs/SUPABASE-SETUP.md ko‘rsatmalariga amal qiling." : "Follow docs/SUPABASE-SETUP.md."}</li></ol></section>;
  await connection();
  const client = await createServerSupabase();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return <AdminLogin lang={lang} />;
  const { data: membership } = await client.from("admin_users").select("role,active").eq("user_id", user.id).maybeSingle();
  if (!membership?.active) return <section className="admin-setup"><h2>{lang === "uz" ? "Ruxsat berilmagan" : "Access not authorized"}</h2><p>{lang === "uz" ? "Hisob tasdiqlangan maktab administratorlari ro‘yxatida yo‘q." : "This account is not on the approved school administrator list."}</p><AdminSignOut lang={lang} /></section>;
  const { data: assurance } = await client.auth.mfa.getAuthenticatorAssuranceLevel();
  if (assurance?.currentLevel !== "aal2") return <><AdminSession lang={lang} email={user.email ?? ""} role={membership.role} /><AdminMfa lang={lang} /></>;
  const { data, error } = await client.from("content_items").select("*").order("updated_at", { ascending: false });
  if (error) return <section className="admin-setup"><h2>{lang === "uz" ? "CMS ma’lumotlarini yuklab bo‘lmadi" : "Could not load CMS data"}</h2><p>{lang === "uz" ? "Birozdan keyin qayta urinib ko‘ring yoki tizim egasiga xabar bering." : "Try again shortly or notify the system owner."}</p><AdminSignOut lang={lang} /></section>;
  const { data: audit } = membership.role === "owner" || membership.role === "administrator"
    ? await client.from("audit_log").select("id,actor_id,action,record_id,record_type,occurred_at").order("occurred_at", { ascending: false }).limit(25)
    : { data: [] };
  const { data: authors, error: authorsError } = await client.from("publication_authors").select("id,name,role_uz,role_en,bio_uz,bio_en,profile_published,active").order("name");
  const { data: revisions, error: revisionsError } = membership.role !== "writer"
    ? await client.from("content_revisions").select("id,content_item_id,version,snapshot,changed_by,changed_at").order("changed_at", { ascending: false }).limit(300)
    : { data: [], error: null };
  const health: AdminHealth[] = [];
  if (authorsError) health.push({ level: "error", messageUz: "Mualliflar ro‘yxatini yuklab bo‘lmadi.", messageEn: "The writer directory could not be loaded." });
  if (revisionsError) health.push({ level: "warning", messageUz: "Tahrir tarixi ishlamayapti. Editorial operations migratsiyasini tekshiring.", messageEn: "Revision history is unavailable. Check the editorial operations migration." });
  if (!process.env["SUPABASE_" + "SERVICE" + "_ROLE_KEY"]) health.push({ level: "error", messageUz: "Server Supabase kaliti sozlanmagan; newsletter va rejalashtirish ishlamaydi.", messageEn: "The server Supabase key is missing; newsletters and scheduling will not work." });
  if (!process.env.RESEND_API_KEY) health.push({ level: "error", messageUz: "Resend kaliti sozlanmagan; email yuborilmaydi.", messageEn: "The Resend key is missing; email delivery will not work." });
  if (!process.env.SCHEDULER_SECRET) health.push({ level: "warning", messageUz: "Rejalashtirilgan nashrlar uchun SCHEDULER_SECRET sozlanmagan.", messageEn: "SCHEDULER_SECRET is missing, so scheduled publishing cannot run." });
  return <><AdminSession lang={lang} email={user.email ?? ""} role={membership.role} /><AdminConsole lang={lang} initialRecords={(data ?? []) as AdminRecord[]} initialAudit={(audit ?? []) as AuditRecord[]} initialAuthors={(authors ?? []) as PublicationAuthor[]} initialRevisions={(revisions ?? []) as RevisionRecord[]} health={health} role={membership.role} currentUserId={user.id} /></>;
}

function AdminSession({ lang, email, role }: { lang: Lang; email: string; role: string }) {
  const labels: Record<string, { uz: string; en: string }> = { owner: { uz: "Tizim egasi", en: "Owner" }, administrator: { uz: "Administrator", en: "Administrator" }, editor: { uz: "Muharrir", en: "Editor" }, writer: { uz: "Muallif", en: "Writer" } };
  return <div className="admin-session"><span>{email} · {labels[role]?.[lang] ?? role}</span><div className="admin-session-actions"><LanguageSwitch lang={lang} href={`/${lang === "uz" ? "en" : "uz"}/admin`} label={lang === "uz" ? "English" : "O‘zbekcha"} /><AdminSignOut lang={lang} /></div></div>;
}
