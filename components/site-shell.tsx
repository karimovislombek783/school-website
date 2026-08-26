"use client";

import Link from "next/link";
import { useState } from "react";
import { Globe2, Menu, X } from "lucide-react";
import { copy, Lang, siteIdentity } from "@/lib/site-content";

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
          <Link href={`/${lang}`} className="site-brand" aria-label={`${siteIdentity.publicName} — ${t.nav.home}`}>
            <span className="brand-mark">M</span>
            <span className="brand-copy">
              <strong>{siteIdentity.publicName}</strong>
              <small>{siteIdentity.domain}</small>
            </span>
          </Link>
          <nav className="desktop-nav" aria-label="Primary navigation">
            {navRoutes.map((route) => (
              <Link key={route} className={current === route ? "active" : ""} href={`/${lang}/${route}`}>
                {t.nav[route]}
              </Link>
            ))}
          </nav>
          <div className="header-actions">
            <Link className="language-link" href={alternatePath}>
              <Globe2 size={17} aria-hidden="true" /> {t.alternateLanguage}
            </Link>
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
            <Link href={alternatePath} onClick={() => setOpen(false)}>{t.alternateLanguage}</Link>
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
          <div className="site-brand footer-brand"><span className="brand-mark">M</span><strong>{siteIdentity.publicName}</strong></div>
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
