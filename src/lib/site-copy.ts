import { type SiteLocale } from "@/lib/site-locale";

type SiteCopy = {
  brandTagline: string;
  nav: {
    catalog: string;
    about: string;
    canon: string;
    request: string;
    forum: string;
    aiGuide: string;
    reports: string;
    system: string;
  };
  auth: {
    sessionUnavailable: string;
    login: string;
    signUp: string;
    me: string;
    logout: string;
    member: string;
  };
  search: {
    scopeLabel: string;
    catalog: string;
    forum: string;
    catalogPlaceholder: string;
    forumPlaceholder: string;
    submit: string;
  };
  footer: {
    sitemap: string;
    notes: string;
    fictionNote: string;
    timeZonePrefix: string;
    language: string;
    home: string;
  };
  fab: {
    requestEntry: string;
    writeForum: string;
  };
  common: {
    backToCatalog: string;
    backToHome: string;
  };
  languages: Record<SiteLocale, string>;
};

const SITE_COPY: Record<SiteLocale, SiteCopy> = {
  en: {
    brandTagline: "Field Catalog",
    nav: {
      catalog: "Catalog",
      about: "About",
      canon: "Canon",
      request: "Request",
      forum: "Forum",
      aiGuide: "AI Guide",
      reports: "Reports",
      system: "System",
    },
    auth: {
      sessionUnavailable: "Session unavailable",
      login: "Login",
      signUp: "Sign up",
      me: "Me",
      logout: "Logout",
      member: "Member",
    },
    search: {
      scopeLabel: "Search scope",
      catalog: "Catalog",
      forum: "Forum",
      catalogPlaceholder: "Search catalog entries",
      forumPlaceholder: "Search forum posts",
      submit: "Search",
    },
    footer: {
      sitemap: "Sitemap",
      notes: "Notes",
      fictionNote: "Fictional project. The catalog entries are written as in-world documents.",
      timeZonePrefix: "Timezone: ",
      language: "Language",
      home: "Home",
    },
    fab: {
      requestEntry: "Request entry",
      writeForum: "Write forum",
    },
    common: {
      backToCatalog: "← Back to catalog",
      backToHome: "← Back to home",
    },
    languages: {
      en: "English",
      ko: "한국어",
      ja: "日本語",
    },
  },
  ko: {
    brandTagline: "현장 카탈로그",
    nav: {
      catalog: "카탈로그",
      about: "소개",
      canon: "캐넌",
      request: "요청",
      forum: "포럼",
      aiGuide: "AI 가이드",
      reports: "신고",
      system: "시스템",
    },
    auth: {
      sessionUnavailable: "세션 확인 불가",
      login: "로그인",
      signUp: "가입",
      me: "내 계정",
      logout: "로그아웃",
      member: "회원",
    },
    search: {
      scopeLabel: "검색 범위",
      catalog: "카탈로그",
      forum: "포럼",
      catalogPlaceholder: "카탈로그 항목 검색",
      forumPlaceholder: "포럼 글 검색",
      submit: "검색",
    },
    footer: {
      sitemap: "사이트맵",
      notes: "안내",
      fictionNote: "허구 프로젝트입니다. 카탈로그 엔트리는 세계관 내부 문서 형식으로 작성됩니다.",
      timeZonePrefix: "시간대: ",
      language: "언어",
      home: "홈",
    },
    fab: {
      requestEntry: "엔트리 요청",
      writeForum: "포럼 글쓰기",
    },
    common: {
      backToCatalog: "← 카탈로그로 돌아가기",
      backToHome: "← 홈으로 돌아가기",
    },
    languages: {
      en: "English",
      ko: "한국어",
      ja: "日本語",
    },
  },
  ja: {
    brandTagline: "フィールドカタログ",
    nav: {
      catalog: "カタログ",
      about: "概要",
      canon: "世界設定",
      request: "リクエスト",
      forum: "フォーラム",
      aiGuide: "AIガイド",
      reports: "報告",
      system: "システム",
    },
    auth: {
      sessionUnavailable: "セッションを確認できません",
      login: "ログイン",
      signUp: "登録",
      me: "マイページ",
      logout: "ログアウト",
      member: "メンバー",
    },
    search: {
      scopeLabel: "検索範囲",
      catalog: "カタログ",
      forum: "フォーラム",
      catalogPlaceholder: "カタログ項目を検索",
      forumPlaceholder: "フォーラム投稿を検索",
      submit: "検索",
    },
    footer: {
      sitemap: "サイトマップ",
      notes: "メモ",
      fictionNote: "フィクション作品のサイトです。カタログ記事は世界内文書として書かれています。",
      timeZonePrefix: "タイムゾーン: ",
      language: "言語",
      home: "ホーム",
    },
    fab: {
      requestEntry: "エントリを依頼",
      writeForum: "フォーラム投稿",
    },
    common: {
      backToCatalog: "← カタログに戻る",
      backToHome: "← ホームに戻る",
    },
    languages: {
      en: "English",
      ko: "한국어",
      ja: "日本語",
    },
  },
};

export function getSiteCopy(locale: SiteLocale) {
  return SITE_COPY[locale];
}
