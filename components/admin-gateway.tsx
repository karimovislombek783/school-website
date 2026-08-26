import { AdminConsole, AdminRecord } from "@/components/admin-console";
import { AdminLogin, AdminSignOut } from "@/components/admin-auth";
import { Lang } from "@/lib/site-content";
import { createServerSupabase, isSupabaseConfigured } from "@/lib/supabase/server";

export async function AdminGateway({ lang }: { lang: Lang }) {
  if (!isSupabaseConfigured()) return <section className="admin-setup"><h2>{lang === "uz" ? "Xavfsiz CMS ulanishga tayyor" : "Secure CMS ready to connect"}</h2><p>{lang === "uz" ? "Maktab uchun alohida Supabase loyihasi hali ulanmagan. Shu sababli tizim hech qanday ma’lumot saqlamaydi va soxta administrator kirishini ko‘rsatmaydi." : "A separate school Supabase project has not been connected, so the system stores nothing and does not pretend that administrator access is active."}</p><ol><li>{lang === "uz" ? "Alohida maktab Supabase loyihasini yarating." : "Create a separate school Supabase project."}</li><li>{lang === "uz" ? "supabase/schema.sql faylini ishga tushiring." : "Run supabase/schema.sql."}</li><li>{lang === "uz" ? "docs/SUPABASE-SETUP.md ko‘rsatmalariga amal qiling." : "Follow docs/SUPABASE-SETUP.md."}</li></ol></section>;
  const client = await createServerSupabase();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return <AdminLogin lang={lang} />;
  const { data: membership } = await client.from("admin_users").select("role,active").eq("user_id", user.id).maybeSingle();
  if (!membership?.active) return <section className="admin-setup"><h2>{lang === "uz" ? "Ruxsat berilmagan" : "Access not authorized"}</h2><p>{lang === "uz" ? "Hisob tasdiqlangan maktab administratorlari ro‘yxatida yo‘q." : "This account is not on the approved school administrator list."}</p><AdminSignOut lang={lang} /></section>;
  const { data } = await client.from("content_items").select("*").order("updated_at", { ascending: false });
  return <><div className="admin-session"><span>{user.email} · {membership.role}</span><AdminSignOut lang={lang} /></div><AdminConsole lang={lang} initialRecords={(data ?? []) as AdminRecord[]} /></>;
}
