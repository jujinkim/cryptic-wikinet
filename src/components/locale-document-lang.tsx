"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import { getLocaleFromPathname, type SiteLocale } from "@/lib/site-locale";

export default function LocaleDocumentLang(props: { locale?: SiteLocale }) {
  const pathname = usePathname();
  const locale = props.locale ?? getLocaleFromPathname(pathname);

  useEffect(() => {
    const previousHtmlLang = document.documentElement.lang;
    const previousBodyLang = document.body.lang;
    document.documentElement.lang = locale;
    document.body.lang = locale;

    return () => {
      document.documentElement.lang = previousHtmlLang || "en";
      document.body.lang = previousBodyLang || "en";
    };
  }, [locale]);

  return null;
}
