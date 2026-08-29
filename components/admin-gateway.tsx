import { AdminConsole, AdminRecord, AuditRecord } from "@/components/admin-console";
import { AdminLogin, AdminSignOut } from "@/components/admin-auth";
import { AdminMfa } from "@/components/admin-mfa";
import { Lang } from "@/lib/site-content";
import { createServerSupabase, isSupabaseConfigured } from "@/lib/supabase/server";
import { connection } from "next/server";

export async function AdminGateway({ lang }: { lang: Lang }) {
  if (!isSupabaseConfigured()) return <section className="admin-setup"><h2>{lang === "uz" ? "Xavfsiz CMS ulanishga tayyor" : "Secure CMS ready to connect"}</h2><p>{lang === "uz" ? "Maktab uchun alohida Supabase loyihasi hali ulanmagan. Shu sababli tizim hech qanday ma’lumot saqlamaydi va soxta administrator kirishini ko‘rsatmaydi." : "A separate school Supabase project has not been connected, so the system stores nothing and does not pretend that administrator access is active."}</p><ol><li>{lang === "uz" ? "Alohida maktab Supabase loyihasini yarating." : "Create a separate school Supabase project."}</li><li>{lang === "uz" ? "supabase/schema.sql faylini ishga tushiring." : "Run supabase/schema.sql."}</li><li>{lang === "uz" ? "docs/SUPABASE-SETUP.md ko‘rsatmalariga amal qiling." : "Follow docs/SUPABASE-SETUP.md."}</li></ol></section>;
  await connection();
  const client = await createServerSupabase();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return <AdminLogin lang={lang} />;
  const { data: membership } = await client.from("admin_users").select("role,active").eq("user_id", user.id).maybeSingle();
  if (!membership?.active) return <section className="admin-setup"><h2>{lang === "uz" ? "Ruxsat berilmagan" : "Access not authorized"}</h2><p>{lang === "uz" ? "Hisob tasdiqlangan maktab administratorlari ro‘yxatida yo‘q." : "This account is not on the approved school administrator list."}</p><AdminSignOut lang={lang} /></section>;
  const { data: assurance } = await client.auth.mfa.getAuthenticatorAssuranceLevel();
  if (assurance?.currentLevel !== "aal2") return <><div className="admin-session"><span>{user.email} · {membership.role}</span><AdminSignOut lang={lang} /></div><AdminMfa lang={lang} /></>;
  const { data, error } = await client.from("content_items").select("*").order("updated_at", { ascending: false });
  if (error) return <section className="admin-setup"><h2>{lang === "uz" ? "CMS ma’lumotlarini yuklab bo‘lmadi" : "Could not load CMS data"}</h2><p>{lang === "uz" ? "Birozdan keyin qayta urinib ko‘ring yoki tizim egasiga xabar bering." : "Try again shortly or notify the system owner."}</p><AdminSignOut lang={lang} /></section>;
  const { data: audit } = membership.role === "owner" || membership.role === "administrator"
    ? await client.from("audit_log").select("id,actor_id,action,record_id,record_type,occurred_at").order("occurred_at", { ascending: false }).limit(25)
    : { data: [] };
  return <><div className="admin-session"><span>{user.email} · {membership.role}</span><AdminSignOut lang={lang} /></div><AdminConsole lang={lang} initialRecords={(data ?? []) as AdminRecord[]} initialAudit={(audit ?? []) as AuditRecord[]} role={membership.role} currentUserId={user.id} /></>;
}
