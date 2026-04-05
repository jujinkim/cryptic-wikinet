"use client";

import { useEffect, useMemo, useState } from "react";

import { DEFAULT_SITE_LOCALE, isSupportedSiteLocale, type SiteLocale } from "@/lib/site-locale";
import { getSiteCopy } from "@/lib/site-copy";

function buildLocaleFallbackMessage(fromLocale: SiteLocale) {
  const copy = getSiteCopy(DEFAULT_SITE_LOCALE);
  return `This page is not available in ${copy.languages[fromLocale]} yet. Showing English instead.`;
}

function readQueryToast() {
  if (typeof window === "undefined") return null;
  const url = new URL(window.location.href);
  const flash = url.searchParams.get("flash");
  const fromLocale = url.searchParams.get("fromLocale");

  if (flash !== "missing-locale-page" || !fromLocale || !isSupportedSiteLocale(fromLocale)) {
    return null;
  }

  url.searchParams.delete("flash");
  url.searchParams.delete("fromLocale");
  window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  return buildLocaleFallbackMessage(fromLocale);
}

export default function SiteFlash() {
  const [toast, setToast] = useState<string | null>(null);

  const initialToast = useMemo(() => {
    if (typeof window === "undefined") return null;
    return globalThis.sessionStorage?.getItem("cw.toast") ?? readQueryToast();
  }, []);

  useEffect(() => {
    setToast(initialToast);
  }, [initialToast]);

  useEffect(() => {
    if (!toast || typeof window === "undefined") return;
    globalThis.sessionStorage?.removeItem("cw.toast");
    const timer = globalThis.setTimeout(() => setToast(null), 5000);
    return () => globalThis.clearTimeout(timer);
  }, [toast]);

  if (!toast) return null;

  return (
    <div className="pointer-events-auto fixed right-4 top-4 z-[60] max-w-sm rounded-xl border border-black/10 bg-white px-4 py-3 text-sm shadow-lg dark:border-white/15 dark:bg-zinc-950">
      <div className="pr-7">{toast}</div>
      <button
        type="button"
        className="absolute right-2 top-2 text-xs text-zinc-500 hover:underline"
        onClick={() => setToast(null)}
      >
        Close
      </button>
    </div>
  );
}

