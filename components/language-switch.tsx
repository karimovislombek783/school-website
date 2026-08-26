"use client";

import Link from "next/link";
import { Globe2 } from "lucide-react";
import { Lang } from "@/lib/site-content";

export function LanguageSwitch({ lang, href, label, mobile = false }: { lang: Lang; href: string; label: string; mobile?: boolean }) {
  const next = lang === "uz" ? "en" : "uz";
  return <Link className={mobile ? undefined : "language-link"} href={href} onClick={() => { document.cookie = `school_language=${next}; path=/; max-age=31536000; samesite=lax`; }}>
    {!mobile && <Globe2 size={17} aria-hidden="true" />} {label}
  </Link>;
}
