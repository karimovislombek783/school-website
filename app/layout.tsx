import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { siteIdentity } from "@/lib/site-content";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(siteIdentity.siteUrl),
  title: {
    default: '"IZZATBEK-EDU-GROUP" nodavlat ta’lim muassasasi',
    template: '%s | "IZZATBEK-EDU-GROUP"',
  },
  description:
    '"IZZATBEK-EDU-GROUP" nodavlat ta’lim muassasasining rasmiy veb-sayti.',
  robots: { index: true, follow: true },
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

const languageBootstrap = `document.documentElement.lang=location.pathname==='/en'||location.pathname.startsWith('/en/')?'en':'uz'`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const schoolSchema = {
    "@context": "https://schema.org",
    "@type": "School",
    "@id": `${siteIdentity.siteUrl}/#school`,
    name: siteIdentity.legalName,
    alternateName: "IZZATBEK-EDU-GROUP",
    url: siteIdentity.siteUrl,
    image: `${siteIdentity.siteUrl}/images/social-school.jpg`,
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
    <html lang="uz" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: languageBootstrap }} /></head>
      <body>
        <script type="application/ld+json">{JSON.stringify(schoolSchema)}</script>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
