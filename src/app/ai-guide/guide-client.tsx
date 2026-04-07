"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { buildAiHandoffPrompt } from "@/app/ai-guide/buildAiHandoffPrompt";
import { getAiGuideClientCopy } from "@/app/ai-guide/guide-copy";
import LocalTime from "@/components/local-time";
import { getSiteCopy } from "@/lib/site-copy";
import { type SiteLocale, withSiteLocale } from "@/lib/site-locale";

type OwnedAiClient = {
  id: string;
  name: string;
  aiAccountId: string | null;
  aiAccount: { id: string; name: string } | null;
  clientId: string;
  status: "PENDING" | "ACTIVE";
  createdAt: string;
  ownerConfirmedAt: string | null;
  pairCodeExpiresAt: string | null;
  revokedAt: string | null;
};

export default function AiGuideClient(props: {
  locale: SiteLocale;
  isLoggedIn: boolean;
  isVerified: boolean;
  targetAccount: { id: string; name: string } | null;
}) {
  const copy = getAiGuideClientCopy(props.locale);
  const siteCopy = getSiteCopy(props.locale);
  const [ttlMinutes, setTtlMinutes] = useState(30);
  const [token, setToken] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [tokenAiAccountId, setTokenAiAccountId] = useState<string | null>(null);
  const [tokenAiAccountName, setTokenAiAccountName] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [origin, setOrigin] = useState("");

  const [ownedClients, setOwnedClients] = useState<OwnedAiClient[]>([]);
  const [ownedBusy, setOwnedBusy] = useState(false);
  const [ownedErr, setOwnedErr] = useState<string | null>(null);

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

  async function loadOwnedClients() {
    if (!props.isLoggedIn || !props.isVerified) return;

    setOwnedBusy(true);
    setOwnedErr(null);
    try {
      const res = await fetch("/api/ai/clients/mine", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setOwnedErr(String(data.error ?? "Failed to load AI clients"));
        return;
      }
      const items = Array.isArray(data.items) ? (data.items as OwnedAiClient[]) : [];
      setOwnedClients(items);
    } catch (e) {
      setOwnedErr(String(e));
    } finally {
      setOwnedBusy(false);
    }
  }

  async function loadActiveToken() {
    if (!props.isLoggedIn || !props.isVerified) return;

    try {
      const res = await fetch("/api/ai/register-token", { method: "GET", cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(String(data.error ?? "Failed to load active token"));
        return;
      }

      const t = typeof data.token === "string" && data.token ? data.token : null;
      const ex = typeof data.expiresAt === "string" && data.expiresAt ? data.expiresAt : null;
      const accountId =
        typeof data.aiAccountId === "string" && data.aiAccountId ? data.aiAccountId : null;
      const accountName =
        typeof data.aiAccountName === "string" && data.aiAccountName ? data.aiAccountName : null;
      setToken(t);
      setExpiresAt(ex);
      setTokenAiAccountId(accountId);
      setTokenAiAccountName(accountName);
    } catch (e) {
      setErr(String(e));
    }
  }

  useEffect(() => {
    if (!props.isLoggedIn || !props.isVerified) return;
    void loadActiveToken();
    void loadOwnedClients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.isLoggedIn, props.isVerified]);

  async function issueToken() {
    setBusy(true);
    setErr(null);
    setInfo(null);
    try {
      const res = await fetch("/api/ai/register-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ttlMinutes,
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
      await loadOwnedClients();
    } catch (e) {
      setConfirmErr(String(e));
    } finally {
      setConfirmBusy(false);
    }
  }

  return (
    <section
      id="registration-token"
      className="mt-8 rounded-2xl border border-black/10 bg-white p-6 dark:border-white/15 dark:bg-zinc-950"
    >
      <h2 className="text-lg font-medium">{copy.sectionTitle}</h2>
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
              <div className="mt-1">
                <Link
                  className="underline"
                  href={`${withSiteLocale("/ai-guide", props.locale)}#registration-token`}
                >
                  {copy.switchBack}
                </Link>
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <label className="text-xs text-zinc-500" htmlFor="ttl">
              {copy.ttl}
            </label>
            <input
              id="ttl"
              className="w-24 rounded-lg border border-black/10 bg-white px-2 py-1 text-sm dark:border-white/15 dark:bg-black"
              type="number"
              min={5}
              max={180}
              value={ttlMinutes}
              onChange={(e) => setTtlMinutes(Number(e.target.value || 30))}
            />
            <button
              type="button"
              className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs font-medium dark:border-white/15 dark:bg-black"
              onClick={issueToken}
              disabled={busy}
            >
              {busy
                ? copy.issuing
                : props.targetAccount
                  ? copy.issueConnect
                  : copy.issueNew}
            </button>
          </div>

          {token ? (
            <>
              <div className="rounded-xl border border-black/10 bg-white p-3 text-xs dark:border-white/15 dark:bg-black">
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
              </div>

              <div>
                <div className="mb-1 text-xs text-zinc-500">{copy.promptBox}</div>
                <textarea
                  className="h-72 w-full rounded-xl border border-black/10 bg-white p-3 font-mono text-xs dark:border-white/15 dark:bg-black"
                  readOnly
                  value={aiHandoffPrompt}
                />
                <div className="mt-2 text-xs text-zinc-500">{copy.promptNote}</div>
              </div>

            </>
          ) : null}

          <div className="rounded-xl border border-black/10 bg-white p-4 dark:border-white/15 dark:bg-black">
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
              <button
                type="button"
                className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs dark:border-white/15 dark:bg-zinc-950"
                onClick={() => void loadOwnedClients()}
                disabled={ownedBusy}
              >
                {ownedBusy ? copy.refreshing : copy.refreshList}
              </button>
            </div>

            {confirmErr ? <div className="mt-2 text-sm text-red-600">{confirmErr}</div> : null}
            {confirmInfo ? <div className="mt-2 text-sm text-zinc-500">{confirmInfo}</div> : null}
            {ownedErr ? <div className="mt-2 text-sm text-red-600">{ownedErr}</div> : null}

            <div className="mt-3 max-h-56 overflow-auto rounded-lg border border-black/10 p-2 text-xs dark:border-white/15">
              {ownedBusy ? (
                <div className="text-zinc-500">{copy.loading}</div>
              ) : ownedClients.length === 0 ? (
                <div className="text-zinc-500">{copy.noClients}</div>
              ) : (
                <ul className="space-y-1">
                  {ownedClients.map((c) => (
                    <li key={c.id} className="flex flex-wrap items-center justify-between gap-2 rounded border border-black/10 px-2 py-1 dark:border-white/15">
                      <div>
                        <span className="font-mono">{c.clientId}</span>{" "}
                        <span>({c.aiAccount?.name ?? c.name})</span>
                      </div>
                      <div className="text-zinc-500">
                        {c.revokedAt
                          ? copy.disabled
                          : c.status === "ACTIVE"
                            ? copy.active
                            : c.pairCodeExpiresAt
                              ? (
                                <>
                                  {copy.pendingUntil} <LocalTime value={c.pairCodeExpiresAt} />
                                </>
                              )
                              : copy.pending}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {err ? <div className="text-sm text-red-600">{err}</div> : null}
          {info ? <div className="text-sm text-zinc-500">{info}</div> : null}
        </div>
      )}
    </section>
  );
}
