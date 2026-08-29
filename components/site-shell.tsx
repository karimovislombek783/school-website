"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { copy, Lang, siteIdentity } from "@/lib/site-content";
import { LanguageSwitch } from "@/components/language-switch";

const navRoutes = ["about", "academics", "teachers", "news", "achievements", "admissions", "contact"] as const;

export function SiteHeader({ lang, current }: { lang: Lang; current: string }) {
  const [open, setOpen] = useState(false);
  const t = copy[lang];
  const alternate = lang === "uz" ? "en" : "uz";
  const alternatePath = current === "home" ? `/${alternate}` : `/${alternate}/${current}`;

  return (
    <>
      <div className="preview-strip">
        <strong>{t.development}</strong>
        <span>{t.developmentNote}</span>
      </div>
      <header className="site-header">
        <div className="header-inner">
          <Link href={`/${lang}`} className="site-brand" aria-label={`${siteIdentity.legalName} — ${t.nav.home}`}>
            <span className="brand-mark">I</span>
            <span className="brand-copy">
              <strong>{siteIdentity.legalName}</strong>
              <small>{siteIdentity.domain}</small>
            </span>
          </Link>
          <nav className="desktop-nav" aria-label="Primary navigation">
            {navRoutes.map((route) => (
              <Link key={route} className={current.split("/")[0] === route ? "active" : ""} href={`/${lang}/${route}`}>
                {t.nav[route]}
              </Link>
            ))}
          </nav>
          <div className="header-actions">
            <LanguageSwitch lang={lang} href={alternatePath} label={t.alternateLanguage} />
            <button className="menu-button" onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Toggle navigation">
              {open ? <X /> : <Menu />}
            </button>
          </div>
        </div>
        {open && (
          <nav className="mobile-nav" aria-label="Mobile navigation">
            <Link href={`/${lang}`} onClick={() => setOpen(false)}>{t.nav.home}</Link>
            {navRoutes.map((route) => (
              <Link key={route} href={`/${lang}/${route}`} onClick={() => setOpen(false)}>{t.nav[route]}</Link>
            ))}
            <span onClick={() => setOpen(false)}><LanguageSwitch mobile lang={lang} href={alternatePath} label={t.alternateLanguage} /></span>
          </nav>
        )}
      </header>
    </>
  );
}

export function SiteFooter({ lang }: { lang: Lang }) {
  const t = copy[lang];
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div>
          <div className="site-brand footer-brand"><span className="brand-mark">I</span><strong>{siteIdentity.legalName}</strong></div>
          <p>{t.footer.description}</p>
        </div>
        <div>
          <h2>{lang === "uz" ? "Bog‘lanish" : "Contact"}</h2>
          <p>{siteIdentity.address}</p><p>{siteIdentity.phone}</p><p>{siteIdentity.email}</p>
        </div>
        <div>
          <h2>{lang === "uz" ? "Ma’lumot" : "Information"}</h2>
          <Link href={`/${lang}/legal`}>{t.footer.legal}</Link>
          <Link href={`/${lang}/privacy`}>{t.footer.privacy}</Link>
          <Link href={`/${lang}/admin`}>{t.footer.admin}</Link>
        </div>
      </div>
      <div className="footer-bottom">
        <span>© {new Date().getFullYear()} {siteIdentity.legalName}. {t.footer.rights}</span>
        <span>{t.development}</span>
      </div>
    </footer>
  );
}
