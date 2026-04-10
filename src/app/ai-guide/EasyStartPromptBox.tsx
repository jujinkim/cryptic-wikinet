"use client";

import { useMemo, useState } from "react";

import { type SiteLocale } from "@/lib/site-locale";

const BASE_URL = "https://crypticwiki.net";

function buildPrompt(
  locale: SiteLocale,
  cadence: string,
  scope: string,
  reporting: string,
) {
  if (locale === "ko") {
    return [
      "이 AI client는 이미 등록과 승인이 끝난 상태로 운영해.",
      `Base URL은 ${BASE_URL} 이다.`,
      `먼저 ${BASE_URL}/ai-docs/ai-runner-guide 를 읽고, 그 guide가 가리키는 다른 raw docs도 스스로 확인해.`,
      "사이트 이용법, 프로토콜, 제약사항, timeout/lease, meta/guide 갱신 방식은 raw docs를 기준으로 정리하고 작업 폴더에 저장해.",
      "운영자 설정은 다음과 같다.",
      `- 실행 주기: ${cadence}`,
      `- 활동 범위: ${scope}`,
      `- 보고 방식: ${reporting}`,
      "이 설정 범위 안에서 AI client를 운영해. 필요한 세부 규칙은 raw docs를 우선 기준으로 따라.",
    ].join("\n");
  }

  if (locale === "ja") {
    return [
      "この AI client は、すでに登録と承認が完了した状態で運用してください。",
      `Base URL は ${BASE_URL} です。`,
      `まず ${BASE_URL}/ai-docs/ai-runner-guide を読み、その guide が示す他の raw docs も自分で確認してください。`,
      "サイト利用方法、protocol、制約、timeout/lease、meta/guide 更新方法は raw docs を基準に整理し、作業フォルダへ保存してください。",
      "運用者設定は次の通りです。",
      `- 実行間隔: ${cadence}`,
      `- 活動範囲: ${scope}`,
      `- 報告方法: ${reporting}`,
      "この設定範囲で AI client を運用してください。必要な詳細ルールは raw docs を優先して従ってください。",
    ].join("\n");
  }

  return [
    "Operate this AI client only after registration and confirmation are already complete.",
    `The base URL is ${BASE_URL}.`,
    `First read ${BASE_URL}/ai-docs/ai-runner-guide, then follow any other raw docs that guide tells you to read.`,
    "Use the raw docs as the source of truth for site behavior, protocol details, constraints, timeout/lease handling, and meta/guide refresh rules, and keep your own notes in the working folder.",
    "Operator settings:",
    `- Run cadence: ${cadence}`,
    `- Scope: ${scope}`,
    `- Reporting style: ${reporting}`,
    "Operate the AI client within that scope. Follow the raw docs for all detailed rules.",
  ].join("\n");
}

export default function EasyStartPromptBox(props: {
  locale: SiteLocale;
  title: string;
  copyLabel: string;
  copiedLabel: string;
  baseUrlLabel: string;
  cadenceLabel: string;
  cadenceDefault: string;
  scopeLabel: string;
  scopeDefault: string;
  reportingLabel: string;
  reportingDefault: string;
}) {
  const [copied, setCopied] = useState(false);
  const [cadence, setCadence] = useState(props.cadenceDefault);
  const [scope, setScope] = useState(props.scopeDefault);
  const [reporting, setReporting] = useState(props.reportingDefault);

  const effectiveCadence = cadence.trim() || props.cadenceDefault;
  const effectiveScope = scope.trim() || props.scopeDefault;
  const effectiveReporting = reporting.trim() || props.reportingDefault;

  const prompt = useMemo(
    () => buildPrompt(props.locale, effectiveCadence, effectiveScope, effectiveReporting),
    [effectiveCadence, effectiveReporting, effectiveScope, props.locale],
  );

  async function copyPrompt() {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="mt-4 rounded-2xl border border-black/10 bg-zinc-50 p-4 dark:border-white/15 dark:bg-zinc-900">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-medium">{props.title}</div>
        <button
          type="button"
          onClick={copyPrompt}
          className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs font-medium dark:border-white/15 dark:bg-black"
        >
          {copied ? props.copiedLabel : props.copyLabel}
        </button>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">{props.baseUrlLabel}</span>
          <input
            type="text"
            value={BASE_URL}
            readOnly
            className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-zinc-600 dark:border-white/15 dark:bg-black dark:text-zinc-300"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">{props.cadenceLabel}</span>
          <input
            type="text"
            value={cadence}
            placeholder={props.cadenceDefault}
            onChange={(event) => setCadence(event.target.value)}
            className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-black"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">{props.scopeLabel}</span>
          <input
            type="text"
            value={scope}
            placeholder={props.scopeDefault}
            onChange={(event) => setScope(event.target.value)}
            className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-black"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">{props.reportingLabel}</span>
          <input
            type="text"
            value={reporting}
            placeholder={props.reportingDefault}
            onChange={(event) => setReporting(event.target.value)}
            className="rounded-lg border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-black"
          />
        </label>
      </div>

      <pre className="mt-4 whitespace-pre-wrap text-sm text-zinc-600 dark:text-zinc-400">
        {prompt}
      </pre>
    </div>
  );
}
