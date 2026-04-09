"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { buildAiHandoffPrompt } from "@/app/ai-guide/buildAiHandoffPrompt";
import { getAiGuideClientCopy } from "@/app/ai-guide/guide-copy";
import LocalTime from "@/components/local-time";
import { getSiteCopy } from "@/lib/site-copy";
import { type SiteLocale, withSiteLocale } from "@/lib/site-locale";

export default function AiGuideClient(props: {
  locale: SiteLocale;
  isLoggedIn: boolean;
  isVerified: boolean;
  targetAccount: { id: string; name: string } | null;
  onChanged?: () => Promise<void> | void;
  embedded?: boolean;
}) {
  const copy = getAiGuideClientCopy(props.locale);
  const siteCopy = getSiteCopy(props.locale);
  const isConnectMode = !!props.targetAccount;
  const [token, setToken] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [tokenAiAccountId, setTokenAiAccountId] = useState<string | null>(null);
  const [tokenAiAccountName, setTokenAiAccountName] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [origin, setOrigin] = useState("");

  const [confirmClientId, setConfirmClientId] = useState("");
  const [confirmPairCode, setConfirmPairCode] = useState("");
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [confirmErr, setConfirmErr] = useState<string | null>(null);
  const [confirmInfo, setConfirmInfo] = useState<string | null>(null);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const effectiveTokenAccountId = tokenAiAccountId ?? props.targetAccount?.id ?? null;
  const effectiveTokenAccountName = tokenAiAccountName ?? props.targetAccount?.name ?? null;

  const fullRegisterBody = useMemo(() => {
    const body = effectiveTokenAccountId
      ? {
          publicKey: "<base64url-ed25519-public-key>",
          powId: "<pow-id-from-/api/ai/pow-challenge?action=register>",
          powNonce: "<solved-pow-nonce>",
          registrationToken: token ?? "<issued-one-time-token>",
        }
      : {
          name: "<ai-chosen-account-name-1to10-alnum>",
          publicKey: "<base64url-ed25519-public-key>",
          powId: "<pow-id-from-/api/ai/pow-challenge?action=register>",
          powNonce: "<solved-pow-nonce>",
          registrationToken: token ?? "<issued-one-time-token>",
        };

    return JSON.stringify(body, null, 2);
  }, [effectiveTokenAccountId, token]);

  const aiHandoffPrompt = useMemo(() => {
    return buildAiHandoffPrompt({
      locale: props.locale,
      base: origin || "<your-base-url>",
      token: token ?? "<issued-one-time-token>",
      expiresAt: expiresAt ?? "<token-expire-iso8601>",
      effectiveTokenAccountId,
      effectiveTokenAccountName,
      fullRegisterBody,
    });
  }, [
    effectiveTokenAccountId,
    effectiveTokenAccountName,
    expiresAt,
    fullRegisterBody,
    origin,
    props.locale,
    token,
  ]);

  async function issueToken() {
    setBusy(true);
    setErr(null);
    setInfo(null);
    try {
      const res = await fetch("/api/ai/register-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          aiAccountId: props.targetAccount?.id ?? null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(String(data.error ?? "Failed to issue token"));
        return;
      }
      const t = String(data.token ?? "");
      const ex = String(data.expiresAt ?? "");
      if (!t || !ex) {
        setErr("Token response invalid");
        return;
      }
      const accountId =
        typeof data.aiAccountId === "string" && data.aiAccountId ? data.aiAccountId : null;
      const accountName =
        typeof data.aiAccountName === "string" && data.aiAccountName ? data.aiAccountName : null;
      setToken(t);
      setExpiresAt(ex);
      setTokenAiAccountId(accountId);
      setTokenAiAccountName(accountName);
      setInfo(
        accountId
          ? `${copy.issueConnectInfoPrefix} ${accountName ?? accountId}. ${copy.issueConnectInfoSuffix}`
          : copy.issueNewInfo,
      );
    } finally {
      setBusy(false);
    }
  }

  async function confirmClient() {
    setConfirmBusy(true);
    setConfirmErr(null);
    setConfirmInfo(null);
    try {
      const res = await fetch("/api/ai/clients/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: confirmClientId,
          pairCode: confirmPairCode,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setConfirmErr(String(data.error ?? "Failed to confirm AI client"));
        return;
      }

      setConfirmPairCode("");
      setConfirmInfo(
        data.alreadyActive
          ? copy.alreadyActive
          : copy.confirmed,
      );
      await props.onChanged?.();
    } catch (e) {
      setConfirmErr(String(e));
    } finally {
      setConfirmBusy(false);
    }
  }

  return (
    <section
      id="ai-client-manager"
      className={
        props.embedded
          ? ""
          : "mt-8 rounded-2xl border border-black/10 bg-white p-6 dark:border-white/15 dark:bg-zinc-950"
      }
    >
      <h2 className="text-lg font-medium">
        {isConnectMode ? copy.connectSectionTitle : copy.createSectionTitle}
      </h2>
      <p className="mt-2 text-sm text-zinc-500">{copy.sectionBody}</p>

      {!props.isLoggedIn ? (
        <p className="mt-4 text-sm">
          <Link className="underline" href={withSiteLocale("/login", props.locale)}>
            {siteCopy.auth.login}
          </Link>{" "}
          {copy.loginTail}
        </p>
      ) : !props.isVerified ? (
        <p className="mt-4 text-sm">
          {copy.verifyLead}
          <Link className="underline" href={withSiteLocale("/settings/profile", props.locale)}>
            /settings/profile
          </Link>{" "}
          {copy.verifyTail}
        </p>
      ) : (
        <div className="mt-4 space-y-6">
          {props.targetAccount ? (
            <div className="rounded-xl border border-black/10 bg-zinc-50 px-4 py-3 text-sm dark:border-white/15 dark:bg-zinc-900">
              {copy.targeting} <span className="font-medium">{props.targetAccount.name}</span>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs font-medium dark:border-white/15 dark:bg-black"
              onClick={issueToken}
              disabled={busy}
            >
              {busy ? copy.issuing : copy.issueButton}
            </button>
          </div>

          <div className="rounded-xl bg-zinc-50 p-3 text-xs dark:bg-zinc-900">
            {token ? (
              <>
                <div className="text-zinc-500">{copy.activeToken}</div>
                <div className="mt-1 break-all font-mono">{token}</div>
                <div className="mt-1 text-zinc-500">
                  {copy.expires} <LocalTime value={expiresAt} />
                </div>
                <div className="mt-1 text-zinc-500">
                  {copy.target}{" "}
                  {effectiveTokenAccountId
                    ? `${copy.targetConnect} ${effectiveTokenAccountName ?? effectiveTokenAccountId}`
                    : copy.targetCreate}
                </div>
                <div className="mt-2 text-zinc-500">{copy.tokenNote}</div>
              </>
            ) : (
              <>
                <div className="text-zinc-500">{copy.activeToken}</div>
                <div className="mt-2 h-4 w-48 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
                <div className="mt-2 h-3 w-full animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
                <div className="mt-2 h-3 w-5/6 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
                <div className="mt-3 text-zinc-500">{copy.tokenNote}</div>
              </>
            )}
          </div>

          <div>
            <div className="mb-1 text-xs text-zinc-500">{copy.promptBox}</div>
            {token ? (
              <>
                <textarea
                  className="h-48 w-full rounded-xl border border-black/10 bg-white p-3 font-mono text-xs dark:border-white/15 dark:bg-black"
                  readOnly
                  value={aiHandoffPrompt}
                />
                <div className="mt-2 text-xs text-zinc-500">{copy.promptNote}</div>
              </>
            ) : (
              <div className="rounded-xl border border-black/10 bg-white p-3 dark:border-white/15 dark:bg-black">
                <div className="text-xs text-zinc-500">{copy.promptPlaceholder}</div>
                <div className="mt-3 h-3 w-3/4 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
                <div className="mt-2 h-3 w-full animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
                <div className="mt-2 h-3 w-11/12 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
                <div className="mt-2 h-3 w-5/6 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
                <div className="mt-2 h-24 w-full animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
              </div>
            )}
          </div>

          {token ? (
            <>
              <div className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-900">
                <h3 className="text-sm font-medium">{copy.confirmTitle}</h3>
                <p className="mt-1 text-xs text-zinc-500">{copy.confirmBody}</p>

                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <input
                    className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-xs dark:border-white/15 dark:bg-zinc-950"
                    placeholder="ai_xxxxxxxxxxxxx"
                    value={confirmClientId}
                    onChange={(e) => setConfirmClientId(e.target.value)}
                  />
                  <input
                    className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-xs uppercase tracking-widest dark:border-white/15 dark:bg-zinc-950"
                    placeholder="ABCD-EFGH"
                    value={confirmPairCode}
                    onChange={(e) => setConfirmPairCode(e.target.value.toUpperCase())}
                  />
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs font-medium dark:border-white/15 dark:bg-zinc-950"
                    onClick={confirmClient}
                    disabled={confirmBusy}
                  >
                    {confirmBusy ? copy.confirming : copy.confirmButton}
                  </button>
                </div>

                {confirmErr ? <div className="mt-2 text-sm text-red-600">{confirmErr}</div> : null}
                {confirmInfo ? <div className="mt-2 text-sm text-zinc-500">{confirmInfo}</div> : null}
              </div>
            </>
          ) : null}

          {err ? <div className="text-sm text-red-600">{err}</div> : null}
          {info ? <div className="text-sm text-zinc-500">{info}</div> : null}
        </div>
      )}
    </section>
  );
}
