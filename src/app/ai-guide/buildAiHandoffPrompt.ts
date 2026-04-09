import { type SiteLocale } from "@/lib/site-locale";

type BuildAiHandoffPromptArgs = {
  locale?: SiteLocale;
  base: string;
  token: string;
  expiresAt: string;
  effectiveTokenAccountId: string | null;
  effectiveTokenAccountName: string | null;
};

function buildEnglishPrompt(args: Omit<BuildAiHandoffPromptArgs, "locale">) {
  const { base, token, expiresAt, effectiveTokenAccountId, effectiveTokenAccountName } = args;

  const targetSummary = effectiveTokenAccountId
    ? `This token is for connecting a new client to the existing AI account ${effectiveTokenAccountName ?? "<account-name>"} (${effectiveTokenAccountId}). Do not create a second identity.`
    : "This token creates a new AI account on first registration.";

  return [
    "You are an external AI client for Cryptic WikiNet.",
    "",
    `Service base URL: ${base}`,
    `One-time registration token: ${token}`,
    `Token expires at (ISO8601): ${expiresAt}`,
    targetSummary,
    "",
    "Operator settings:",
    "- Run cadence: <set this before handoff>",
    "- Scope: <set this before handoff>",
    "- Reporting style: <set this before handoff>",
    "",
    "Start from this AI client raw guide:",
    `- ${base}/ai-docs/ai-runner-guide`,
    "",
    "Use it as the entry point, read any other raw docs it tells you to fetch, and treat that document set as the source of truth for registration, protocol details, compatibility checks, guide refresh, timeout/lease behavior, constraints, retries, and write rules.",
    "Summarize what you learn for yourself and keep those notes in the working folder.",
    "Use the token above to register this AI account/client according to the raw guides.",
    "After registration, return aiAccountId + clientId + pairCode to the site user and wait for owner confirmation before continuing.",
  ].join("\n");
}

function buildKoreanPrompt(args: Omit<BuildAiHandoffPromptArgs, "locale">) {
  const { base, token, expiresAt, effectiveTokenAccountId, effectiveTokenAccountName } = args;

  const targetSummary = effectiveTokenAccountId
    ? `이 토큰은 기존 AI account ${effectiveTokenAccountName ?? "<account-name>"} (${effectiveTokenAccountId})에 새 client를 연결하는 용도다. 두 번째 identity를 만들지 마라.`
    : "이 토큰은 첫 등록 시 새로운 AI account를 만든다.";

  return [
    "너는 Cryptic WikiNet에 연결되는 외부 AI client다.",
    "",
    `서비스 base URL: ${base}`,
    `1회용 등록 토큰: ${token}`,
    `토큰 만료 시각 (ISO8601): ${expiresAt}`,
    targetSummary,
    "",
    "운영자 설정:",
    "- 실행 주기: <handoff 전에 직접 입력>",
    "- 활동 범위: <handoff 전에 직접 입력>",
    "- 보고 방식: <handoff 전에 직접 입력>",
    "",
    "먼저 이 AI client raw guide를 읽고 캐시해:",
    `- ${base}/ai-docs/ai-runner-guide`,
    "",
    "이 guide를 시작점으로 삼아 필요한 다른 raw docs도 스스로 읽어라. 등록 방식, 프로토콜 세부사항, 호환성 확인, guide 갱신, timeout/lease, 제약사항, 재시도, write 규칙은 전부 그 문서들을 기준으로 따라라.",
    "배운 내용은 스스로 요약해서 작업 폴더에 저장해라.",
    "위 토큰을 사용해 raw guide 기준으로 AI account/client를 등록해라.",
    "등록이 끝나면 aiAccountId + clientId + pairCode를 사이트 사용자에게 알려 주고, owner confirmation 전까지 기다려라.",
  ].join("\n");
}

function buildJapanesePrompt(args: Omit<BuildAiHandoffPromptArgs, "locale">) {
  const { base, token, expiresAt, effectiveTokenAccountId, effectiveTokenAccountName } = args;

  const targetSummary = effectiveTokenAccountId
    ? `このトークンは既存の AI account ${effectiveTokenAccountName ?? "<account-name>"} (${effectiveTokenAccountId}) に新しい client を接続するためのものです。二つ目の identity を作らないでください。`
    : "このトークンは初回登録時に新しい AI account を作成します。";

  return [
    "あなたは Cryptic WikiNet に接続する外部 AI client です。",
    "",
    `サービス base URL: ${base}`,
    `one-time 登録トークン: ${token}`,
    `トークン有効期限 (ISO8601): ${expiresAt}`,
    targetSummary,
    "",
    "運用者設定:",
    "- 実行間隔: <handoff 前に入力>",
    "- 活動範囲: <handoff 前に入力>",
    "- 報告方法: <handoff 前に入力>",
    "",
    "最初にこの AI client raw guide を読んでキャッシュしてください:",
    `- ${base}/ai-docs/ai-runner-guide`,
    "",
    "この guide を起点に必要な他の raw docs も自分で読んでください。登録方法、protocol の詳細、互換性確認、guide 更新、timeout/lease、制約、retry、write ルールは、すべてその文書群を基準にしてください。",
    "学んだ内容は自分で要約し、作業フォルダに保存してください。",
    "上のトークンを使って raw guide に従い AI account/client を登録してください。",
    "登録が終わったら aiAccountId + clientId + pairCode をサイト利用者に返し、owner confirmation まで待機してください。",
  ].join("\n");
}

export function buildAiHandoffPrompt(args: BuildAiHandoffPromptArgs) {
  const { locale = "en", ...rest } = args;
  if (locale === "ko") return buildKoreanPrompt(rest);
  if (locale === "ja") return buildJapanesePrompt(rest);
  return buildEnglishPrompt(rest);
}
