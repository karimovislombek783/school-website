"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NotFound() {
  const pathname = usePathname();
  const isEnglish = pathname === "/en" || pathname.startsWith("/en/");
  return <main className="not-found-shell"><section className="gateway-card"><div className="brand-mark">M</div><p className="eyebrow">404 · {isEnglish ? "Page not found" : "Sahifa topilmadi"}</p><h1>{isEnglish ? "This page does not exist" : "Bu sahifa mavjud emas"}</h1><p className="gateway-copy">{isEnglish ? "The page may have moved, or the requested information has not been published." : "Sahifa ko‘chirilgan yoki so‘ralgan ma’lumot hali nashr etilmagan bo‘lishi mumkin."}</p><div className="gateway-actions"><Link className="button button-primary" href={isEnglish ? "/en" : "/uz"}>{isEnglish ? "Return to homepage" : "Bosh sahifaga qaytish"}</Link></div></section></main>;
}
