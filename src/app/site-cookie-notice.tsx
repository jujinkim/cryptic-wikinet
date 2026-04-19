"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import {
  COOKIE_CONSENT_OPEN_EVENT,
  allowsPreferenceStorage,
  writeClientCookieConsent,
  type CookieConsentChoice,
} from "@/lib/cookie-consent";
import { getSiteCopy } from "@/lib/site-copy";
import { getLocaleFromPathname, withSiteLocale } from "@/lib/site-locale";
import { useCookieConsent } from "@/lib/use-cookie-consent";

export default function SiteCookieNotice(props: {
  initialChoice: CookieConsentChoice | null;
}) {
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const copy = getSiteCopy(locale);
  const { choice, allowsPreferences } = useCookieConsent(props.initialChoice);
  const [open, setOpen] = useState(() => props.initialChoice === null);
  const showingSavedChoice = choice !== null;
  const isOpen = open || choice === null;
  const currentSetting = allowsPreferenceStorage(choice)
    ? copy.cookieNotice.preferencesSetting
    : copy.cookieNotice.essentialSetting;

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOpen: EventListener = () => {
      setOpen(true);
    };

    window.addEventListener(COOKIE_CONSENT_OPEN_EVENT, handleOpen);
    return () => window.removeEventListener(COOKIE_CONSENT_OPEN_EVENT, handleOpen);
  }, []);

  function saveChoice(next: CookieConsentChoice) {
    writeClientCookieConsent(next);
    setOpen(false);
  }

  if (!isOpen && showingSavedChoice) return null;

  return (
    <div className="pointer-events-none fixed inset-x-4 top-20 z-[75] sm:left-auto sm:right-4 sm:w-full sm:max-w-md">
      <div className="pointer-events-auto rounded-3xl border border-black/10 bg-white/95 p-4 text-sm shadow-2xl backdrop-blur dark:border-white/15 dark:bg-zinc-950/95">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="font-medium text-zinc-950 dark:text-zinc-50">{copy.cookieNotice.title}</div>
            {showingSavedChoice ? (
              <div className="mt-1 text-[11px] uppercase tracking-wide text-zinc-500">
                {copy.cookieNotice.currentSettingLabel} {currentSetting}
              </div>
            ) : null}
          </div>
          {showingSavedChoice ? (
            <button
              type="button"
              className="text-xs text-zinc-500 transition hover:underline"
              onClick={() => setOpen(false)}
            >
              {copy.cookieNotice.close}
            </button>
          ) : null}
        </div>

        <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          {copy.cookieNotice.body}
        </p>

        <div className="mt-4 space-y-3">
          <div className="rounded-2xl border border-black/10 bg-white/70 p-3 dark:border-white/15 dark:bg-black/40">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  {copy.cookieNotice.essentialTitle}
                </div>
                <p className="mt-1 text-xs leading-5 text-zinc-600 dark:text-zinc-400">
                  {copy.cookieNotice.essentialBody}
                </p>
              </div>
              <span className="rounded-full border border-black/10 bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-700 dark:border-white/15 dark:bg-zinc-900 dark:text-zinc-200">
                {copy.cookieNotice.alwaysOn}
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-black/10 bg-white/70 p-3 dark:border-white/15 dark:bg-black/40">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  {copy.cookieNotice.preferencesTitle}
                </div>
                <p className="mt-1 text-xs leading-5 text-zinc-600 dark:text-zinc-400">
                  {copy.cookieNotice.preferencesBody}
                </p>
              </div>
              <span
                className={
                  "rounded-full border px-2 py-0.5 text-[11px] font-medium " +
                  (allowsPreferences
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/50 dark:text-emerald-300"
                    : "border-black/10 bg-zinc-100 text-zinc-700 dark:border-white/15 dark:bg-zinc-900 dark:text-zinc-200")
                }
              >
                {allowsPreferences
                  ? copy.cookieNotice.preferencesOn
                  : copy.cookieNotice.preferencesOff}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <Link
            href={withSiteLocale("/privacy", locale)}
            className="text-xs font-medium text-zinc-600 underline decoration-zinc-400 underline-offset-4 transition hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-zinc-50"
          >
            {copy.cookieNotice.learnMore}
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className={
                "rounded-xl border px-3 py-1.5 text-xs font-medium transition " +
                (choice === "essential"
                  ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
                  : "border-black/10 bg-white text-zinc-700 hover:bg-zinc-100 dark:border-white/15 dark:bg-black dark:text-zinc-200 dark:hover:bg-zinc-900")
              }
              onClick={() => saveChoice("essential")}
            >
              {copy.cookieNotice.essentialOnly}
            </button>
            <button
              type="button"
              className={
                "rounded-xl px-3 py-1.5 text-xs font-medium transition " +
                (choice === "preferences" || choice === null
                  ? "bg-black text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                  : "border border-black/10 bg-white text-zinc-700 hover:bg-zinc-100 dark:border-white/15 dark:bg-black dark:text-zinc-200 dark:hover:bg-zinc-900")
              }
              onClick={() => saveChoice("preferences")}
            >
              {copy.cookieNotice.allowPreferences}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
