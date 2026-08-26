"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole, LogOut } from "lucide-react";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { Lang } from "@/lib/site-content";

export function AdminLogin({ lang }: { lang: Lang }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const form = new FormData(event.currentTarget);
    const { error } = await createBrowserSupabase().auth.signInWithPassword({ email: String(form.get("email")), password: String(form.get("password")) });
    setBusy(false);
    if (error) setError(lang === "uz" ? "Kirish ma’lumotlari noto‘g‘ri yoki ruxsat berilmagan." : "The credentials are incorrect or access is not permitted.");
    else router.refresh();
  }
  return <section className="admin-auth-card"><LockKeyhole size={30} /><h2>{lang === "uz" ? "Administrator kirishi" : "Administrator sign in"}</h2><p>{lang === "uz" ? "Faqat maktab tomonidan tasdiqlangan administratorlar uchun." : "For school-approved administrators only."}</p><form onSubmit={submit}><label>{lang === "uz" ? "Elektron pochta" : "Email"}<input name="email" type="email" required autoComplete="username" /></label><label>{lang === "uz" ? "Parol" : "Password"}<input name="password" type="password" required autoComplete="current-password" /></label>{error && <p className="form-error" role="alert">{error}</p>}<button className="button button-primary" disabled={busy}>{busy ? (lang === "uz" ? "Tekshirilmoqda…" : "Checking…") : (lang === "uz" ? "Kirish" : "Sign in")}</button></form></section>;
}

export function AdminSignOut({ lang }: { lang: Lang }) {
  const router = useRouter();
  return <button className="button button-secondary" onClick={async () => { await createBrowserSupabase().auth.signOut(); router.refresh(); }}><LogOut size={17} />{lang === "uz" ? "Chiqish" : "Sign out"}</button>;
}
