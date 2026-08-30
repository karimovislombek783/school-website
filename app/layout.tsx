import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://izzatbek-edu-group.uz"),
  title: {
    default: '"IZZATBEK-EDU-GROUP" nodavlat ta’lim muassasasi',
    template: '%s | "IZZATBEK-EDU-GROUP"',
  },
  description:
    '"IZZATBEK-EDU-GROUP" nodavlat ta’lim muassasasining ikki tilli rasmiy axborot platformasi.',
  robots: { index: true, follow: true },
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="uz">
      <body>{children}</body>
    </html>
  );
}
