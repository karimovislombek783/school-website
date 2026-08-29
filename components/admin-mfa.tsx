"use client";
/* eslint-disable @next/next/no-img-element -- TOTP QR data URLs cannot use the Next image optimizer. */

import { FormEvent, useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { Lang } from "@/lib/site-content";

export function AdminMfa({ lang }: { lang: Lang }) {
  const [factorId, setFactorId] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    let active = true;
    void createBrowserSupabase().auth.mfa.listFactors().then(({ data, error: listError }) => {
      if (!active) return;
      if (listError) setError(lang === "uz" ? "Ikki bosqichli himoyani tekshirib bo‘lmadi." : "Could not check two-factor protection.");
      const existing = data?.totp?.find((factor) => factor.status === "verified");
      if (existing) setFactorId(existing.id);
      setBusy(false);
    });
    return () => { active = false; };
  }, [lang]);

  async function enroll() {
    setBusy(true); setError("");
    const { data, error: enrollError } = await createBrowserSupabase().auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "School CMS",
    });
    setBusy(false);
    if (enrollError || !data?.id || !data.totp?.qr_code) {
      setError(lang === "uz" ? "Authenticator sozlamasini yaratib bo‘lmadi." : "Could not create the authenticator setup.");
      return;
    }
    setFactorId(data.id);
    setQrCode(data.totp.qr_code);
  }

  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const { error: verifyError } = await createBrowserSupabase().auth.mfa.challengeAndVerify({
      factorId,
      code: code.replace(/\s/g, ""),
    });
    setBusy(false);
    if (verifyError) {
      setError(lang === "uz" ? "Tasdiqlash kodi noto‘g‘ri yoki muddati tugagan." : "The verification code is incorrect or expired.");
      return;
    }
    router.refresh();
  }

  return (
    <section className="admin-auth-card">
      <ShieldCheck size={30} />
      <h2>{lang === "uz" ? "Ikki bosqichli himoya" : "Two-factor protection"}</h2>
      <p>{lang === "uz" ? "CMSni ochishdan oldin authenticator ilovasidagi olti xonali kodni tasdiqlang." : "Verify the six-digit code from an authenticator app before opening the CMS."}</p>
      {!factorId ? (
        <button className="button button-primary" type="button" disabled={busy} onClick={enroll}>
          {busy ? (lang === "uz" ? "Tekshirilmoqda…" : "Checking…") : (lang === "uz" ? "Authenticator sozlash" : "Set up authenticator")}
        </button>
      ) : (
        <>
          {qrCode && <div className="mfa-setup"><img src={qrCode} alt={lang === "uz" ? "Authenticator uchun QR kod" : "QR code for authenticator"} /><p>{lang === "uz" ? "QR kodni Google Authenticator, Microsoft Authenticator yoki boshqa TOTP ilovasi bilan skanerlang." : "Scan this QR code using Google Authenticator, Microsoft Authenticator or another TOTP app."}</p></div>}
          <form onSubmit={verify}>
            <label>{lang === "uz" ? "Olti xonali kod" : "Six-digit code"}<input value={code} onChange={(event) => setCode(event.target.value)} inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required /></label>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="button button-primary" disabled={busy}>{busy ? (lang === "uz" ? "Tasdiqlanmoqda…" : "Verifying…") : (lang === "uz" ? "Tasdiqlash" : "Verify")}</button>
          </form>
        </>
      )}
      {!factorId && error && <p className="form-error" role="alert">{error}</p>}
    </section>
  );
}
