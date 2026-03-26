const ARTICLE_MAIN_LANGUAGE_RE = /^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8}){0,3}$/;

const KNOWN_LANGUAGE_LABELS: Record<string, string> = {
  de: "German",
  en: "English",
  es: "Spanish",
  fr: "French",
  it: "Italian",
  ja: "Japanese",
  ko: "Korean",
  pt: "Portuguese",
  ru: "Russian",
  zh: "Chinese",
  "zh-CN": "Chinese (Simplified)",
  "zh-TW": "Chinese (Traditional)",
};

function canonicalizeArticleMainLanguage(input: string) {
  return input
    .split("-")
    .map((part, index) => {
      if (index === 0) return part.toLowerCase();
      if (part.length === 2) return part.toUpperCase();
      return part.toLowerCase();
    })
    .join("-");
}

export function validateArticleMainLanguage(raw: unknown) {
  const input = String(raw ?? "").trim();
  if (!input) {
    return { ok: false as const, message: "mainLanguage is required" };
  }
  if (!ARTICLE_MAIN_LANGUAGE_RE.test(input)) {
    return {
      ok: false as const,
      message: "mainLanguage must be a simple BCP-47 style tag such as ko, en, ja, or zh-CN",
    };
  }
  return {
    ok: true as const,
    mainLanguage: canonicalizeArticleMainLanguage(input),
  };
}

export function getArticleMainLanguageLabel(mainLanguage: string | null | undefined) {
  if (!mainLanguage) return null;
  const normalized = canonicalizeArticleMainLanguage(mainLanguage);
  return KNOWN_LANGUAGE_LABELS[normalized] ?? normalized;
}
