"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { LOCALE_PROMPT_DISMISS_STORAGE_KEY } from "@/lib/cookie-consent";
import { getSiteCopy } from "@/lib/site-copy";
import {
  DEFAULT_SITE_LOCALE,
  getLocaleFromPathname,
  getLanguageLinks,
  isLocalizedStaticPath,
  type SiteLocale,
} from "@/lib/site-locale";
import { usePreferenceStorage } from "@/lib/use-preference-storage";

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

export default function SiteLocalePrompt() {
  const pathname = usePathname();
  const currentLocale = getLocaleFromPathname(pathname);
  const copy = getSiteCopy(currentLocale);
  const links = getLanguageLinks(pathname);
  const fullyTranslated = isLocalizedStaticPath(pathname);
  const {
    allowsPreferences,
    value: storedDismissedPrompt,
    setValue: setStoredDismissedPrompt,
  } = usePreferenceStorage(LOCALE_PROMPT_DISMISS_STORAGE_KEY);
  const [sessionDismissedPrompt, setSessionDismissedPrompt] = useState(false);
  const [suggestedLocale] = useState<SiteLocale | null>(() => detectSuggestedLocale());
  const dismissedPrompt = sessionDismissedPrompt || storedDismissedPrompt === "1";

  const recommendedLink =
    !links || dismissedPrompt || currentLocale !== DEFAULT_SITE_LOCALE || !suggestedLocale
      ? null
      : links.find((item) => item.locale === suggestedLocale && item.locale !== DEFAULT_SITE_LOCALE) ??
        null;

  if (!recommendedLink) return null;

  const promptCopy = getPromptCopy(
    currentLocale,
    copy.languages[recommendedLink.locale],
    fullyTranslated,
  );

  return (
    <div data-testid="site-locale-prompt" className="pointer-events-none fixed bottom-32 right-4 z-[70] max-w-sm">
      <div className="pointer-events-auto rounded-2xl border border-black/10 bg-white p-4 text-sm shadow-lg dark:border-white/15 dark:bg-zinc-950">
        <div className="font-medium text-zinc-950 dark:text-zinc-50">{promptCopy.title}</div>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{promptCopy.body}</p>
        <div className="mt-3 flex items-center justify-end gap-2">
          <button
            type="button"
            className="rounded-xl border border-black/10 bg-white px-3 py-1.5 text-xs font-medium dark:border-white/15 dark:bg-black"
            onClick={() => {
              if (allowsPreferences && setStoredDismissedPrompt("1")) {
                return;
              }

              setSessionDismissedPrompt(true);
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
    </div>
  );
}
