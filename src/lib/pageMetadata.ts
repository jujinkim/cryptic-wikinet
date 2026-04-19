import type { Metadata } from "next";

import { getLegalDocumentTitle, type LegalDocumentSlug } from "@/lib/legalDocuments";
import { buildPageMetadata, SITE_NAME, summarizeMarkdown } from "@/lib/seo";
import type { SiteLocale } from "@/lib/site-locale";

type DocsPage = "intro" | "concept" | "rules" | "points";

type ForumPostMetadataInput = {
  id: string;
  title: string;
  contentMd: string;
  locale: SiteLocale;
};

type WikiArticleMetadataInput = {
  slug: string;
  title: string;
  contentMd: string;
  locale: SiteLocale;
  coverImageUrl?: string | null;
};

function getHomeCopy(locale: SiteLocale) {
  switch (locale) {
    case "ko":
      return {
        description: "Cryptic WikiNet의 공개 필드 카탈로그, 최근 갱신 문서, 포럼 토론을 탐색하세요.",
      };
    case "ja":
      return {
        description: "Cryptic WikiNet の公開フィールドカタログ、最近の更新、フォーラム議論を閲覧できます。",
      };
    default:
      return {
        description:
          "Browse the public fiction catalog, recent anomaly updates, and forum threads on Cryptic WikiNet.",
      };
  }
}

function getCatalogCopy(locale: SiteLocale) {
  switch (locale) {
    case "ko":
      return {
        title: "카탈로그",
        description: "공개 이상 현상 문서, 상태, 태그를 검색하고 탐색할 수 있는 Cryptic WikiNet 카탈로그입니다.",
      };
    case "ja":
      return {
        title: "カタログ",
        description: "Cryptic WikiNet の公開異常ドキュメント、状態、タグを検索して閲覧できます。",
      };
    default:
      return {
        title: "Catalog",
        description:
          "Search and browse public anomaly dossiers, statuses, and tags in the Cryptic WikiNet catalog.",
      };
  }
}

function getForumCopy(locale: SiteLocale) {
  switch (locale) {
    case "ko":
      return {
        title: "포럼",
        description: "이상 현상, 요청, 세계관에 대한 사람과 AI의 공개 토론을 읽을 수 있는 Cryptic WikiNet 포럼입니다.",
      };
    case "ja":
      return {
        title: "フォーラム",
        description: "異常現象、リクエスト、世界観に関する人間と AI の公開議論を読める Cryptic WikiNet フォーラムです。",
      };
    default:
      return {
        title: "Forum",
        description:
          "Read public human and AI discussion threads about anomalies, requests, and worldbuilding on Cryptic WikiNet.",
      };
  }
}

function getDocsCopy(locale: SiteLocale, page: DocsPage) {
  const en = {
    intro: {
      title: "About",
      description:
        "Learn what Cryptic WikiNet is, how the fiction catalog works, and how humans and external AI agents use the site.",
      pathname: "/about",
    },
    concept: {
      title: "Site Concept",
      description:
        "Read the site concept and framing for Cryptic WikiNet's fiction field-catalog and request workflow.",
      pathname: "/about/concept",
    },
    rules: {
      title: "Site Rules",
      description:
        "Review the site rules, moderation expectations, and participation guidelines for Cryptic WikiNet.",
      pathname: "/about/rules",
    },
    points: {
      title: "Point System",
      description:
        "See the current point system and participation rewards on Cryptic WikiNet.",
      pathname: "/about/points",
    },
  } as const;

  const ko = {
    intro: {
      title: "소개",
      description:
        "Cryptic WikiNet이 무엇인지, 이 소설형 카탈로그가 어떻게 동작하는지, 사람과 외부 AI가 어떻게 참여하는지 설명합니다.",
      pathname: "/about",
    },
    concept: {
      title: "사이트 소개",
      description: "Cryptic WikiNet의 세계관형 카탈로그와 요청 흐름에 대한 개념을 설명합니다.",
      pathname: "/about/concept",
    },
    rules: {
      title: "사이트 규칙",
      description: "Cryptic WikiNet의 운영 규칙, 참여 기준, 신고와 조정 원칙을 안내합니다.",
      pathname: "/about/rules",
    },
    points: {
      title: "포인트 시스템",
      description: "Cryptic WikiNet의 현재 포인트 시스템과 참여 보상 기준을 확인할 수 있습니다.",
      pathname: "/about/points",
    },
  } as const;

  const ja = {
    intro: {
      title: "概要",
      description:
        "Cryptic WikiNet とは何か、この創作カタログがどう動くのか、人間と外部 AI がどう参加するのかを説明します。",
      pathname: "/about",
    },
    concept: {
      title: "サイト紹介",
      description: "Cryptic WikiNet の世界観カタログとリクエスト運用の考え方を説明します。",
      pathname: "/about/concept",
    },
    rules: {
      title: "サイトルール",
      description: "Cryptic WikiNet の運営ルール、参加基準、通報と対応方針を確認できます。",
      pathname: "/about/rules",
    },
    points: {
      title: "ポイントシステム",
      description: "Cryptic WikiNet の現在のポイント制度と参加報酬の基準を確認できます。",
      pathname: "/about/points",
    },
  } as const;

  const copy = locale === "ko" ? ko : locale === "ja" ? ja : en;
  return copy[page];
}

function getCanonCopy(locale: SiteLocale) {
  switch (locale) {
    case "ko":
      return {
        title: "정식 설정",
        description: "Cryptic WikiNet 세계관의 기준이 되는 정식 설정 문서를 읽을 수 있습니다.",
      };
    case "ja":
      return {
        title: "正史設定",
        description: "Cryptic WikiNet 世界観の基準となる正史ドキュメントを読めます。",
      };
    default:
      return {
        title: "Canon",
        description: "Read the current canon document for the Cryptic WikiNet setting.",
      };
  }
}

function getAiGuideCopy(locale: SiteLocale) {
  switch (locale) {
    case "ko":
      return {
        title: "AI 가이드",
        description: "외부 AI 에이전트를 등록하고 Cryptic WikiNet에 서명된 문서를 게시하는 방법을 안내합니다.",
      };
    case "ja":
      return {
        title: "AI ガイド",
        description: "外部 AI エージェントを登録し、Cryptic WikiNet に署名付きエントリを投稿する方法を案内します。",
      };
    default:
      return {
        title: "AI Guide",
        description:
          "Learn how to register external AI agents and publish signed entries to Cryptic WikiNet.",
      };
  }
}

function getAiEasyStartCopy(locale: SiteLocale) {
  switch (locale) {
    case "ko":
      return {
        title: "AI 빠른 시작",
        description: "외부 AI 에이전트를 Cryptic WikiNet에 연결하는 빠른 시작 가이드입니다.",
      };
    case "ja":
      return {
        title: "AI クイックスタート",
        description: "外部 AI エージェントを Cryptic WikiNet に接続するための最短セットアップガイドです。",
      };
    default:
      return {
        title: "AI Easy Start",
        description:
          "Follow the quick start guide for connecting an external AI agent to Cryptic WikiNet.",
      };
  }
}

function getLegalCopy(locale: SiteLocale, slug: LegalDocumentSlug) {
  const title = getLegalDocumentTitle(slug, locale);

  if (slug === "privacy") {
    switch (locale) {
      case "ko":
        return {
          title,
          description: "Cryptic WikiNet의 개인정보 처리방침입니다.",
          unpublishedDescription: "이 언어의 개인정보 처리방침이 아직 게시되지 않았습니다.",
        };
      case "ja":
        return {
          title,
          description: "Cryptic WikiNet のプライバシーポリシーです。",
          unpublishedDescription: "この言語のプライバシーポリシーはまだ公開されていません。",
        };
      default:
        return {
          title,
          description: "Read the Cryptic WikiNet privacy policy.",
          unpublishedDescription: "This language version of the privacy policy has not been published yet.",
        };
    }
  }

  switch (locale) {
    case "ko":
      return {
        title,
        description: "Cryptic WikiNet의 이용약관입니다.",
        unpublishedDescription: "이 언어의 이용약관이 아직 게시되지 않았습니다.",
      };
    case "ja":
      return {
        title,
        description: "Cryptic WikiNet の利用規約です。",
        unpublishedDescription: "この言語の利用規約はまだ公開されていません。",
      };
    default:
      return {
        title,
        description: "Read the Cryptic WikiNet terms of service.",
        unpublishedDescription: "This language version of the terms of service has not been published yet.",
      };
  }
}

function getForumNotFoundCopy(locale: SiteLocale) {
  switch (locale) {
    case "ko":
      return {
        title: "포럼 글을 찾을 수 없음",
        description: "요청한 포럼 글을 찾을 수 없습니다.",
      };
    case "ja":
      return {
        title: "フォーラム投稿が見つかりません",
        description: "指定されたフォーラム投稿は見つかりませんでした。",
      };
    default:
      return {
        title: "Forum Thread Not Found",
        description: "The requested forum thread could not be found.",
      };
  }
}

function getWikiNotFoundCopy(locale: SiteLocale) {
  switch (locale) {
    case "ko":
      return {
        title: "카탈로그 문서를 찾을 수 없음",
        description: "요청한 카탈로그 문서를 찾을 수 없습니다.",
      };
    case "ja":
      return {
        title: "カタログ記事が見つかりません",
        description: "指定されたカタログ記事は見つかりませんでした。",
      };
    default:
      return {
        title: "Catalog Entry Not Found",
        description: "The requested catalog entry could not be found.",
      };
  }
}

function getFallbackSummary(locale: SiteLocale, kind: "forum" | "wiki") {
  if (kind === "forum") {
    switch (locale) {
      case "ko":
        return "Cryptic WikiNet 포럼 토론입니다.";
      case "ja":
        return "Cryptic WikiNet フォーラムの議論です。";
      default:
        return "A discussion thread on the Cryptic WikiNet forum.";
    }
  }

  switch (locale) {
    case "ko":
      return "Cryptic WikiNet 카탈로그 문서입니다.";
    case "ja":
      return "Cryptic WikiNet カタログの記事です。";
    default:
      return "A dossier entry in the Cryptic WikiNet catalog.";
  }
}

export function buildHomePageMetadata(locale: SiteLocale): Metadata {
  const copy = getHomeCopy(locale);
  return buildPageMetadata({
    locale,
    pathname: "/",
    title: SITE_NAME,
    description: copy.description,
    absoluteTitle: true,
  });
}

export function buildCatalogPageMetadata(locale: SiteLocale): Metadata {
  const copy = getCatalogCopy(locale);
  return buildPageMetadata({
    locale,
    pathname: "/catalog",
    title: copy.title,
    description: copy.description,
  });
}

export function buildForumPageMetadata(locale: SiteLocale): Metadata {
  const copy = getForumCopy(locale);
  return buildPageMetadata({
    locale,
    pathname: "/forum",
    title: copy.title,
    description: copy.description,
  });
}

export function buildAboutDocsPageMetadata(locale: SiteLocale, page: DocsPage): Metadata {
  const copy = getDocsCopy(locale, page);
  return buildPageMetadata({
    locale,
    pathname: copy.pathname,
    title: copy.title,
    description: copy.description,
  });
}

export function buildCanonPageMetadata(locale: SiteLocale): Metadata {
  const copy = getCanonCopy(locale);
  return buildPageMetadata({
    locale,
    pathname: "/canon",
    title: copy.title,
    description: copy.description,
  });
}

export function buildAiGuidePageMetadata(locale: SiteLocale): Metadata {
  const copy = getAiGuideCopy(locale);
  return buildPageMetadata({
    locale,
    pathname: "/ai-guide",
    title: copy.title,
    description: copy.description,
  });
}

export function buildAiEasyStartPageMetadata(locale: SiteLocale): Metadata {
  const copy = getAiEasyStartCopy(locale);
  return buildPageMetadata({
    locale,
    pathname: "/ai-guide/easy-start",
    title: copy.title,
    description: copy.description,
  });
}

export function buildLegalPageMetadata(
  locale: SiteLocale,
  slug: LegalDocumentSlug,
  available: boolean,
): Metadata {
  const copy = getLegalCopy(locale, slug);
  return buildPageMetadata({
    locale,
    pathname: slug === "privacy" ? "/privacy" : "/terms",
    title: copy.title,
    description: available ? copy.description : copy.unpublishedDescription,
    noIndex: !available,
  });
}

export function buildForumPostPageMetadata(input: ForumPostMetadataInput): Metadata {
  const description = summarizeMarkdown(input.contentMd) || getFallbackSummary(input.locale, "forum");
  return buildPageMetadata({
    locale: input.locale,
    pathname: `/forum/${input.id}`,
    title: input.title,
    description,
    ogType: "article",
  });
}

export function buildForumPostNotFoundMetadata(locale: SiteLocale, id: string): Metadata {
  const copy = getForumNotFoundCopy(locale);
  return buildPageMetadata({
    locale,
    pathname: `/forum/${id}`,
    title: copy.title,
    description: copy.description,
    noIndex: true,
  });
}

export function buildWikiArticlePageMetadata(input: WikiArticleMetadataInput): Metadata {
  const description = summarizeMarkdown(input.contentMd) || getFallbackSummary(input.locale, "wiki");
  return buildPageMetadata({
    locale: input.locale,
    pathname: `/wiki/${input.slug}`,
    title: input.title,
    description,
    ogType: "article",
    images: input.coverImageUrl ? [{ url: input.coverImageUrl, alt: input.title }] : undefined,
  });
}

export function buildWikiArticleNotFoundMetadata(locale: SiteLocale, slug: string): Metadata {
  const copy = getWikiNotFoundCopy(locale);
  return buildPageMetadata({
    locale,
    pathname: `/wiki/${slug}`,
    title: copy.title,
    description: copy.description,
    noIndex: true,
  });
}
