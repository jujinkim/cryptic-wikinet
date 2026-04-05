"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { getSiteCopy } from "@/lib/site-copy";
import {
  DEFAULT_SITE_LOCALE,
  getLocaleFromPathname,
  getLanguageLinks,
  isLocalizedStaticPath,
  type SiteLocale,
} from "@/lib/site-locale";

const LOCALE_PROMPT_DISMISS_KEY = "cw.localePrompt.dismissed";

const TIMEZONE_TO_LOCALE: Partial<Record<string, SiteLocale>> = {
  "Asia/Seoul": "ko",
  "Asia/Tokyo": "ja",
};

function detectSuggestedLocale(): SiteLocale | null {
  if (typeof window === "undefined") return null;

  const languages = navigator.languages?.length
    ? navigator.languages
    : navigator.language
      ? [navigator.language]
      : [];

  for (const language of languages) {
    const primary = language.toLowerCase().split("-")[0];
    if (primary === "ko" || primary === "ja") {
      return primary;
    }
  }

  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return TIMEZONE_TO_LOCALE[timeZone] ?? null;
}

function getPromptCopy(locale: SiteLocale, targetLabel: string, fullyTranslated: boolean) {
  if (!fullyTranslated) {
    if (locale === "ko") {
      return {
        title: `${targetLabel} 인터페이스를 사용할 수 있습니다.`,
        body: "이 페이지는 사이트 인터페이스를 해당 언어로 볼 수 있습니다. 카탈로그, 포럼, 문서 본문은 원문으로 유지될 수 있습니다.",
        accept: `${targetLabel}로 보기`,
        decline: "아니오",
      };
    }

    if (locale === "ja") {
      return {
        title: `${targetLabel} インターフェースを利用できます。`,
        body: "このページではサイトのインターフェースをその言語で表示できます。カタログ、フォーラム、記事本文は原文のまま表示される場合があります。",
        accept: `${targetLabel}で見る`,
        decline: "いいえ",
      };
    }

    return {
      title: `${targetLabel} is available for this page.`,
      body: "The site interface can switch languages here. Catalog, forum, and article content may remain in the original language.",
      accept: `View in ${targetLabel}`,
      decline: "No",
    };
  }

  if (locale === "ko") {
    return {
      title: `${targetLabel} 페이지를 사용할 수 있습니다.`,
      body: "이 페이지는 번역본이 있습니다. 해당 언어 버전으로 이동할까요?",
      accept: `${targetLabel}로 보기`,
      decline: "아니오",
    };
  }

  if (locale === "ja") {
    return {
      title: `${targetLabel} ページを利用できます。`,
      body: "このページには翻訳版があります。その言語版へ移動しますか。",
      accept: `${targetLabel}で見る`,
      decline: "いいえ",
    };
  }

  return {
    title: `${targetLabel} is available for this page.`,
    body: "A translated version exists. Do you want to switch to it?",
    accept: `View in ${targetLabel}`,
    decline: "No",
  };
}

export default function SiteLocaleFab() {
  const pathname = usePathname();
  const currentLocale = getLocaleFromPathname(pathname);
  const copy = getSiteCopy(currentLocale);
  const links = getLanguageLinks(pathname);
  const fullyTranslated = isLocalizedStaticPath(pathname);

  const [openPathname, setOpenPathname] = useState<string | null>(null);
  const [dismissedPrompt, setDismissedPrompt] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(LOCALE_PROMPT_DISMISS_KEY) === "1";
  });
  const [suggestedLocale] = useState<SiteLocale | null>(() => detectSuggestedLocale());

  const recommendedLink =
    !links || dismissedPrompt || currentLocale !== DEFAULT_SITE_LOCALE || !suggestedLocale
      ? null
      : links.find((item) => item.locale === suggestedLocale && item.locale !== DEFAULT_SITE_LOCALE) ??
        null;

  if (!links) return null;

  const isOpen = openPathname === (pathname ?? null);
  const promptCopy = recommendedLink
    ? getPromptCopy(currentLocale, copy.languages[recommendedLink.locale], fullyTranslated)
    : null;

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[70] flex flex-col items-end gap-3">
      {recommendedLink && promptCopy ? (
        <div className="pointer-events-auto max-w-sm rounded-2xl border border-black/10 bg-white p-4 text-sm shadow-lg dark:border-white/15 dark:bg-zinc-950">
          <div className="font-medium text-zinc-950 dark:text-zinc-50">{promptCopy.title}</div>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{promptCopy.body}</p>
          <div className="mt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              className="rounded-xl border border-black/10 bg-white px-3 py-1.5 text-xs font-medium dark:border-white/15 dark:bg-black"
              onClick={() => {
                window.localStorage.setItem(LOCALE_PROMPT_DISMISS_KEY, "1");
                setDismissedPrompt(true);
              }}
            >
              {promptCopy.decline}
            </button>
            <Link
              href={recommendedLink.href}
              className="rounded-xl bg-black px-3 py-1.5 text-xs font-medium text-white dark:bg-white dark:text-black"
            >
              {promptCopy.accept}
            </Link>
          </div>
        </div>
      ) : null}

      <div className="pointer-events-auto flex flex-col items-end gap-2">
        {isOpen ? (
          <div className="rounded-2xl border border-black/10 bg-white p-2 shadow-lg dark:border-white/15 dark:bg-zinc-950">
            <div className="mb-1 px-2 pt-1 text-[10px] font-medium uppercase tracking-[0.2em] text-zinc-500">
              {copy.footer.language}
            </div>
            <div className="flex flex-col gap-1">
              {links.map((item) => {
                const active = item.locale === currentLocale;
                return (
                  <Link
                    key={item.locale}
                    href={item.href}
                    className={`rounded-xl px-3 py-2 text-sm transition ${
                      active
                        ? "bg-black text-white dark:bg-white dark:text-black"
                        : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
                    }`}
                  >
                    {copy.languages[item.locale]}
                  </Link>
                );
              })}
            </div>
          </div>
        ) : null}

        <button
          type="button"
          aria-expanded={isOpen}
          aria-label={copy.footer.language}
          className="flex h-14 min-w-14 items-center justify-center rounded-full border border-black/10 bg-black px-4 text-xs font-medium uppercase tracking-[0.18em] text-white shadow-lg dark:border-white/15 dark:bg-white dark:text-black"
          onClick={() => setOpenPathname(isOpen ? null : (pathname ?? null))}
        >
          {isOpen ? "Close" : currentLocale}
        </button>
      </div>
    </div>
  );
}
