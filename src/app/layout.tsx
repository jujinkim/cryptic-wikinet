import type { Metadata } from "next";
import { headers } from "next/headers";
import { Geist_Mono, IBM_Plex_Sans_KR, Kosugi_Maru, Oxanium } from "next/font/google";
import "./globals.css";

import SiteActionFab from "@/app/site-action-fab";
import SiteFlash from "@/app/site-flash";
import SiteFooter from "@/app/site-footer";
import SiteHeader from "@/app/site-header";
import SiteLocalePrompt from "@/app/site-locale-prompt";
import LocaleDocumentLang from "@/components/locale-document-lang";
import { DEFAULT_SITE_DESCRIPTION, SITE_NAME, getMetadataBase } from "@/lib/seo";
import { DEFAULT_SITE_LOCALE, isSupportedSiteLocale } from "@/lib/site-locale";

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

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: {
    title: SITE_NAME,
    description: DEFAULT_SITE_DESCRIPTION,
    type: "website",
    siteName: SITE_NAME,
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: SITE_NAME,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: DEFAULT_SITE_DESCRIPTION,
    images: ["/twitter-image"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headerStore = await headers();
  const headerLocale = headerStore.get("x-site-locale");
  const htmlLang = headerLocale && isSupportedSiteLocale(headerLocale) ? headerLocale : DEFAULT_SITE_LOCALE;

  return (
    <html
      lang={htmlLang}
      className={`${oxanium.variable} ${ibmPlexSansKr.variable} ${kosugiMaru.variable} ${geistMono.variable}`}
    >
      <body
        lang={htmlLang}
        className="flex min-h-screen flex-col bg-zinc-50 text-zinc-950 antialiased dark:bg-black dark:text-zinc-50"
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
