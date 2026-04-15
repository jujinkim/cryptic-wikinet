import type { LegalDocumentKey } from "@prisma/client";

import type { SiteLocale } from "@/lib/site-locale";

export type LegalDocumentSlug = "privacy" | "terms";

type AgreementCopy = {
  intro: string;
  conjunction: string;
  suffix: string;
};

type LegalDocumentDefinition = {
  slug: LegalDocumentSlug;
  dbKey: LegalDocumentKey;
  titles: Record<SiteLocale, string>;
};

const LEGAL_DOCUMENTS: LegalDocumentDefinition[] = [
  {
    slug: "privacy",
    dbKey: "PRIVACY_POLICY",
    titles: {
      en: "Privacy Policy",
      ko: "개인정보 처리방침",
      ja: "プライバシーポリシー",
    },
  },
  {
    slug: "terms",
    dbKey: "TERMS_OF_SERVICE",
    titles: {
      en: "Terms of Service",
      ko: "이용약관",
      ja: "利用規約",
    },
  },
];

const LEGAL_DOCUMENT_BY_SLUG = Object.fromEntries(
  LEGAL_DOCUMENTS.map((item) => [item.slug, item]),
) as Record<LegalDocumentSlug, LegalDocumentDefinition>;

export function listLegalDocuments() {
  return LEGAL_DOCUMENTS;
}

export function isLegalDocumentSlug(value: string): value is LegalDocumentSlug {
  return value === "privacy" || value === "terms";
}

export function getLegalDocumentDefinitionBySlug(slug: LegalDocumentSlug) {
  return LEGAL_DOCUMENT_BY_SLUG[slug];
}

export function getLegalDocumentPath(slug: LegalDocumentSlug) {
  return slug === "privacy" ? "/privacy" : "/terms";
}

export function getLegalDocumentTitle(slug: LegalDocumentSlug, locale: SiteLocale) {
  return LEGAL_DOCUMENT_BY_SLUG[slug].titles[locale];
}

export function getLegalAgreementCopy(
  locale: SiteLocale,
  tense: "present" | "past" = "present",
): AgreementCopy {
  switch (locale) {
    case "ko":
      return tense === "present"
        ? {
            intro: "계정을 만들면 ",
            conjunction: " 및 ",
            suffix: "에 동의하게 됩니다.",
          }
        : {
            intro: "계정을 만들면서 ",
            conjunction: " 및 ",
            suffix: "에 동의했습니다.",
          };
    case "ja":
      return tense === "present"
        ? {
            intro: "アカウントを作成すると、",
            conjunction: "と",
            suffix: "に同意したものとみなされます。",
          }
        : {
            intro: "アカウントを作成した時点で、",
            conjunction: "と",
            suffix: "に同意したものとみなされます。",
          };
    default:
      return tense === "present"
        ? {
            intro: "By creating an account, you agree to the ",
            conjunction: " and the ",
            suffix: ".",
          }
        : {
            intro: "By creating your account, you agreed to the ",
            conjunction: " and the ",
            suffix: ".",
          };
  }
}
