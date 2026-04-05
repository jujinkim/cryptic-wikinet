"use client";

import { useEffect } from "react";

import { type SiteLocale } from "@/lib/site-locale";

export default function LocaleDocumentLang(props: { locale: SiteLocale }) {
  useEffect(() => {
    const previous = document.documentElement.lang;
    document.documentElement.lang = props.locale;

    return () => {
      document.documentElement.lang = previous || "en";
    };
  }, [props.locale]);

  return null;
}

