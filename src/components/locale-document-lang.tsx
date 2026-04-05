"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import { getLocaleFromPathname, type SiteLocale } from "@/lib/site-locale";

export default function LocaleDocumentLang(props: { locale?: SiteLocale }) {
  const pathname = usePathname();
  const locale = props.locale ?? getLocaleFromPathname(pathname);

  useEffect(() => {
    const previous = document.documentElement.lang;
    document.documentElement.lang = locale;

    return () => {
      document.documentElement.lang = previous || "en";
    };
  }, [locale]);

  return null;
}
