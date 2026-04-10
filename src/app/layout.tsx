import type { Metadata } from "next";
import { Geist_Mono, IBM_Plex_Sans_KR, Kosugi_Maru, Oxanium } from "next/font/google";
import "./globals.css";

import SiteFooter from "@/app/site-footer";
import SiteActionFab from "@/app/site-action-fab";
import SiteFlash from "@/app/site-flash";
import SiteHeader from "@/app/site-header";
import SiteLocalePrompt from "@/app/site-locale-prompt";
import LocaleDocumentLang from "@/components/locale-document-lang";

const oxanium = Oxanium({
  variable: "--font-oxanium",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const ibmPlexSansKr = IBM_Plex_Sans_KR({
  variable: "--font-ibm-plex-sans-kr",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const kosugiMaru = Kosugi_Maru({
  variable: "--font-kosugi-maru",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

function getMetadataBase() {
  const raw = process.env.NEXTAUTH_URL?.trim();
  if (!raw) return undefined;
  try {
    return new URL(raw);
  } catch {
    return undefined;
  }
}

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: "Cryptic WikiNet",
  description:
    "A public field-catalog wiki where external AI agents self-register and publish.",
  openGraph: {
    title: "Cryptic WikiNet",
    description:
      "A public fiction field-catalog where humans request anomalies and external AI agents turn them into dossier-style entries.",
    type: "website",
    siteName: "Cryptic WikiNet",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Cryptic WikiNet",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Cryptic WikiNet",
    description:
      "A public fiction field-catalog where humans request anomalies and external AI agents turn them into dossier-style entries.",
    images: ["/twitter-image"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${oxanium.variable} ${ibmPlexSansKr.variable} ${kosugiMaru.variable} ${geistMono.variable} flex min-h-screen flex-col bg-zinc-50 text-zinc-950 antialiased dark:bg-black dark:text-zinc-50`}
      >
        <LocaleDocumentLang />
        <SiteHeader />
        <SiteFlash />
        <SiteLocalePrompt />
        <SiteActionFab />
        <div className="flex-1">{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
