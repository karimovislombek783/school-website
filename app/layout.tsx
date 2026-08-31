import type { Metadata } from "next";
import { headers } from "next/headers";
import { siteIdentity } from "@/lib/site-content";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://izzatbek-edu-group.uz"),
  title: {
    default: '"IZZATBEK-EDU-GROUP" nodavlat ta’lim muassasasi',
    template: '%s | "IZZATBEK-EDU-GROUP"',
  },
  description:
    '"IZZATBEK-EDU-GROUP" nodavlat ta’lim muassasasining rasmiy veb-sayti.',
  robots: { index: true, follow: true },
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const requestHeaders = await headers();
  const lang = requestHeaders.get("x-school-lang") === "en" ? "en" : "uz";
  const schoolSchema = {
    "@context": "https://schema.org",
    "@type": "School",
    name: siteIdentity.legalName,
    alternateName: "IZZATBEK-EDU-GROUP",
    url: `https://${siteIdentity.domain}`,
    email: siteIdentity.email,
    telephone: siteIdentity.phoneHref,
    address: {
      "@type": "PostalAddress",
      streetAddress: "Ziyolilar MFY, Istiqlol ko‘chasi, 272-uy",
      addressLocality: "Hazorasp tumani",
      addressRegion: "Xorazm viloyati",
      addressCountry: "UZ",
    },
    sameAs: [siteIdentity.telegramUrl, siteIdentity.schoolInstagramUrl],
  };
  return (
    <html lang={lang}>
      <body>
        <script type="application/ld+json">{JSON.stringify(schoolSchema)}</script>
        {children}
      </body>
    </html>
  );
}
