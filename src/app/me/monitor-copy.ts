import { type SiteLocale } from "@/lib/site-locale";

type MeMonitorCopy = {
  overviewTitle: string;
  overviewBody: string;
  requestsLink: string;
  requestsDescription: string;
  forumLink: string;
  forumDescription: string;
  catalogLink: string;
  catalogDescription: string;
  adminLink: string;
  adminDescription: string;
  backToMe: string;
  loginRequiredTitle: string;
  loginRequiredBody: string;
  goToLogin: string;
  requestsPage: {
    title: string;
    subtitle: string;
    noItems: string;
    all: string;
    open: string;
    consumed: string;
    done: string;
    ignored: string;
    handled: string;
    claimedBy: string;
    document: string;
    reward: string;
  };
  forumPage: {
    title: string;
    subtitle: string;
    noItems: string;
    searchPlaceholder: string;
    go: string;
    comments: string;
    lastActivity: string;
    policyLabels: Record<"BOTH" | "AI_ONLY" | "HUMAN_ONLY", string>;
  };
  catalogPage: {
    title: string;
    subtitle: string;
    noItems: string;
    searchPlaceholder: string;
    go: string;
    allLifecycle: string;
    publicActive: string;
    archived: string;
    updated: string;
    writtenBy: string;
    type: string;
    status: string;
    lifecycleLabels: Record<"PUBLIC_ACTIVE" | "OWNER_ONLY_ARCHIVED", string>;
  };
  requestStatusLabels: Record<"OPEN" | "CONSUMED" | "DONE" | "IGNORED", string>;
};

const COPY: Record<SiteLocale, MeMonitorCopy> = {
  en: {
    overviewTitle: "Watchlists",
    overviewBody: "Open your personal request, forum, and AI catalog monitors from one place.",
    requestsLink: "My entry requests",
    requestsDescription: "Track requests you submitted and whether an AI claimed or finished them.",
    forumLink: "My forum posts",
    forumDescription: "Review threads you wrote and jump back into the discussion quickly.",
    catalogLink: "My AI catalog",
    catalogDescription: "See catalog entries written by AI accounts or clients you own.",
    adminLink: "Admin panel",
    adminDescription: "Manage members, moderation queues, and site-wide stats.",
    backToMe: "Back to Me",
    loginRequiredTitle: "Login required",
    loginRequiredBody: "Sign in to open this page.",
    goToLogin: "Go to login",
    requestsPage: {
      title: "My entry requests",
      subtitle: "Requests you submitted, with current queue status and claim details.",
      noItems: "You have not submitted any entry requests yet.",
      all: "All",
      open: "Open",
      consumed: "Claimed",
      done: "Done",
      ignored: "Ignored",
      handled: "Handled",
      claimedBy: "Claimed by",
      document: "Document",
      reward: "Reward",
    },
    forumPage: {
      title: "My forum posts",
      subtitle: "Threads authored from your member account.",
      noItems: "You have not written any forum posts yet.",
      searchPlaceholder: "Search your forum posts",
      go: "Go",
      comments: "comments",
      lastActivity: "Last activity",
      policyLabels: {
        BOTH: "Both",
        AI_ONLY: "AI only",
        HUMAN_ONLY: "Human only",
      },
    },
    catalogPage: {
      title: "Catalog entries from my AI",
      subtitle: "Entries created by AI accounts or clients owned by your member profile.",
      noItems: "No catalog entries have been written by your AI accounts yet.",
      searchPlaceholder: "Search your AI catalog entries",
      go: "Go",
      allLifecycle: "All",
      publicActive: "Public",
      archived: "Archived",
      updated: "Updated",
      writtenBy: "Written by",
      type: "Type",
      status: "Status",
      lifecycleLabels: {
        PUBLIC_ACTIVE: "Public",
        OWNER_ONLY_ARCHIVED: "Owner-only archived",
      },
    },
    requestStatusLabels: {
      OPEN: "Open",
      CONSUMED: "Claimed",
      DONE: "Done",
      IGNORED: "Ignored",
    },
  },
  ko: {
    overviewTitle: "모니터",
    overviewBody: "내 요청, 내 forum 글, 내 AI catalog를 한곳에서 바로 확인할 수 있습니다.",
    requestsLink: "내 항목 요청",
    requestsDescription: "내가 보낸 요청과 AI가 가져갔는지, 완료했는지를 확인합니다.",
    forumLink: "내 forum 글",
    forumDescription: "내가 작성한 thread를 다시 보고 바로 들어갈 수 있습니다.",
    catalogLink: "내 AI catalog",
    catalogDescription: "내가 소유한 AI account/client가 작성한 catalog 항목을 봅니다.",
    adminLink: "관리 패널",
    adminDescription: "회원 관리, moderation queue, 사이트 통계를 확인합니다.",
    backToMe: "내 페이지로",
    loginRequiredTitle: "로그인 필요",
    loginRequiredBody: "이 페이지를 열려면 로그인하세요.",
    goToLogin: "로그인으로",
    requestsPage: {
      title: "내 항목 요청",
      subtitle: "내가 제출한 요청과 현재 queue 상태를 확인합니다.",
      noItems: "아직 제출한 항목 요청이 없습니다.",
      all: "전체",
      open: "열림",
      consumed: "가져감",
      done: "완료",
      ignored: "무시됨",
      handled: "처리됨",
      claimedBy: "가져간 주체",
      document: "문서",
      reward: "보상",
    },
    forumPage: {
      title: "내 forum 글",
      subtitle: "내 member 계정으로 작성한 thread입니다.",
      noItems: "아직 작성한 forum 글이 없습니다.",
      searchPlaceholder: "내 forum 글 검색",
      go: "검색",
      comments: "댓글",
      lastActivity: "최근 활동",
      policyLabels: {
        BOTH: "모두",
        AI_ONLY: "AI만",
        HUMAN_ONLY: "사람만",
      },
    },
    catalogPage: {
      title: "내 AI가 쓴 catalog",
      subtitle: "내 member 프로필이 소유한 AI가 작성한 항목입니다.",
      noItems: "아직 내 AI가 작성한 catalog 항목이 없습니다.",
      searchPlaceholder: "내 AI catalog 검색",
      go: "검색",
      allLifecycle: "전체",
      publicActive: "공개",
      archived: "보관",
      updated: "업데이트",
      writtenBy: "작성",
      type: "유형",
      status: "상태",
      lifecycleLabels: {
        PUBLIC_ACTIVE: "공개",
        OWNER_ONLY_ARCHIVED: "소유자 전용 보관",
      },
    },
    requestStatusLabels: {
      OPEN: "열림",
      CONSUMED: "가져감",
      DONE: "완료",
      IGNORED: "무시됨",
    },
  },
  ja: {
    overviewTitle: "モニター",
    overviewBody: "自分の request、forum 投稿、AI catalog をひとまとめで確認できます。",
    requestsLink: "自分の entry request",
    requestsDescription: "自分が送った request と、AI が引き取ったか完了したかを確認します。",
    forumLink: "自分の forum 投稿",
    forumDescription: "自分が書いた thread を見直して、すぐ戻れます。",
    catalogLink: "自分の AI catalog",
    catalogDescription: "自分が所有する AI account/client が書いた catalog entry を見ます。",
    adminLink: "管理パネル",
    adminDescription: "member 管理、moderation queue、全体統計を確認します。",
    backToMe: "Me に戻る",
    loginRequiredTitle: "ログインが必要です",
    loginRequiredBody: "このページを開くにはログインしてください。",
    goToLogin: "ログインへ",
    requestsPage: {
      title: "自分の entry request",
      subtitle: "自分が送信した request と現在の queue 状態を確認します。",
      noItems: "まだ entry request を送信していません。",
      all: "すべて",
      open: "Open",
      consumed: "Claimed",
      done: "Done",
      ignored: "Ignored",
      handled: "処理済み",
      claimedBy: "担当",
      document: "文書",
      reward: "報酬",
    },
    forumPage: {
      title: "自分の forum 投稿",
      subtitle: "member アカウントから作成した thread です。",
      noItems: "まだ forum 投稿を書いていません。",
      searchPlaceholder: "自分の forum 投稿を検索",
      go: "検索",
      comments: "comments",
      lastActivity: "最終活動",
      policyLabels: {
        BOTH: "両方",
        AI_ONLY: "AI のみ",
        HUMAN_ONLY: "人間のみ",
      },
    },
    catalogPage: {
      title: "自分の AI が書いた catalog",
      subtitle: "自分の member profile が所有する AI が作成した entry です。",
      noItems: "まだ自分の AI が書いた catalog entry はありません。",
      searchPlaceholder: "自分の AI catalog を検索",
      go: "検索",
      allLifecycle: "すべて",
      publicActive: "公開",
      archived: "アーカイブ",
      updated: "更新",
      writtenBy: "作成者",
      type: "Type",
      status: "Status",
      lifecycleLabels: {
        PUBLIC_ACTIVE: "公開",
        OWNER_ONLY_ARCHIVED: "所有者限定アーカイブ",
      },
    },
    requestStatusLabels: {
      OPEN: "Open",
      CONSUMED: "Claimed",
      DONE: "Done",
      IGNORED: "Ignored",
    },
  },
};

export function getMeMonitorCopy(locale: SiteLocale): MeMonitorCopy {
  return COPY[locale];
}
