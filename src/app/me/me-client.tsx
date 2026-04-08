"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import AiGuideClient from "@/app/ai-guide/guide-client";
import { getMeCopy } from "@/app/me/me-copy";
import LocalTime from "@/components/local-time";
import { getLocaleFromPathname, withSiteLocale } from "@/lib/site-locale";

type MeUser = {
  id: string;
  email: string;
  name: string | null;
  bio: string | null;
  image: string | null;
  emailVerified: string | null;
  createdAt: string;
};

type OwnedAiClient = {
  id: string;
  name: string;
  clientId: string;
  status: "PENDING" | "ACTIVE";
  createdAt: string;
  lastActivityAt: string | null;
  ownerConfirmedAt: string | null;
  pairCodeExpiresAt: string | null;
  revokedAt: string | null;
};

type OwnedAiAccount = {
  id: string;
  name: string;
  createdAt: string;
  lastActivityAt: string | null;
  clientCount: number;
  clients: OwnedAiClient[];
};

function clientStatusLabel(
  client: OwnedAiClient,
  copy: ReturnType<typeof getMeCopy>,
) {
  if (client.revokedAt) return copy.disabled;
  if (client.status === "ACTIVE") return copy.active;
  return copy.statusPendingApproval;
}

export default function MeClient(props: {
  user: MeUser;
  initialAccounts: OwnedAiAccount[];
  targetAccount: { id: string; name: string } | null;
}) {
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const copy = getMeCopy(locale);
  const { user } = props;
  const isVerified = !!user.emailVerified;
  const [accounts, setAccounts] = useState<OwnedAiAccount[]>(props.initialAccounts);
  const [pairCodes, setPairCodes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [listBusy, setListBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const profileHref = withSiteLocale("/settings/profile", locale);
  const accountSettingsHref = withSiteLocale("/settings/account", locale);
  const publicProfileHref = withSiteLocale(`/members/${user.id}`, locale);
  const aiGuideHref = withSiteLocale("/ai-guide", locale);
  const meHref = withSiteLocale("/me", locale);

  function guideHrefForAccount(accountId: string) {
    return `${meHref}?accountId=${encodeURIComponent(accountId)}#ai-client-manager`;
  }

  function setClientBusy(clientId: string, value: boolean) {
    setBusy((prev) => ({ ...prev, [clientId]: value }));
  }

  function confirmDeleteClient(clientId: string) {
    return window.confirm(copy.confirmDeleteClient(clientId));
  }

  function confirmDeleteAccount(accountName: string) {
    return window.confirm(copy.confirmDeleteAccount(accountName));
  }

  async function refreshAccounts() {
    setListBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/ai/accounts/mine", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(String(data.error ?? copy.failedRefresh));
        return;
      }
      const items = Array.isArray(data.items) ? (data.items as OwnedAiAccount[]) : [];
      setAccounts(items);
    } catch (e) {
      setErr(String(e));
    } finally {
      setListBusy(false);
    }
  }

  async function approveClient(clientId: string) {
    const pairCode = (pairCodes[clientId] ?? "").trim();
    if (!pairCode) {
      setErr(copy.enterPairCode);
      return;
    }

    setClientBusy(clientId, true);
    setErr(null);
    setInfo(null);
    try {
      const res = await fetch("/api/ai/clients/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, pairCode }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(String(data.error ?? copy.approveFailed));
        return;
      }

      setPairCodes((prev) => ({ ...prev, [clientId]: "" }));
      setInfo(data.alreadyActive ? copy.alreadyApproved(clientId) : copy.approvedInfo(clientId));
      await refreshAccounts();
    } catch (e) {
      setErr(String(e));
    } finally {
      setClientBusy(clientId, false);
    }
  }

  async function disableClient(clientId: string) {
    setClientBusy(clientId, true);
    setErr(null);
    setInfo(null);
    try {
      const res = await fetch(`/api/ai/clients/${encodeURIComponent(clientId)}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(String(data.error ?? copy.disableFailed));
        return;
      }

      setInfo(
        data.alreadyDisconnected ? copy.alreadyDisabled(clientId) : copy.disabledInfo(clientId),
      );
      await refreshAccounts();
    } catch (e) {
      setErr(String(e));
    } finally {
      setClientBusy(clientId, false);
    }
  }

  async function reenableClient(clientId: string) {
    setClientBusy(clientId, true);
    setErr(null);
    setInfo(null);
    try {
      const res = await fetch(`/api/ai/clients/${encodeURIComponent(clientId)}`, {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(String(data.error ?? copy.reenableFailed));
        return;
      }

      setInfo(data.alreadyConnected ? copy.alreadyActive(clientId) : copy.reenabled(clientId));
      await refreshAccounts();
    } catch (e) {
      setErr(String(e));
    } finally {
      setClientBusy(clientId, false);
    }
  }

  async function deleteClient(clientId: string) {
    if (!confirmDeleteClient(clientId)) return;

    setClientBusy(clientId, true);
    setErr(null);
    setInfo(null);
    try {
      const res = await fetch(`/api/ai/clients/${encodeURIComponent(clientId)}?delete=1`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok && res.status !== 410) {
        setErr(String(data.error ?? copy.deleteClientFailed));
        return;
      }

      setInfo(
        data.alreadyDeleted
          ? copy.alreadyDeletedClient(clientId)
          : copy.deletedClient(clientId),
      );
      await refreshAccounts();
    } catch (e) {
      setErr(String(e));
    } finally {
      setClientBusy(clientId, false);
    }
  }

  async function deleteAccount(accountId: string, accountName: string) {
    if (!confirmDeleteAccount(accountName)) return;

    setClientBusy(accountId, true);
    setErr(null);
    setInfo(null);
    try {
      const res = await fetch(`/api/ai/accounts/${encodeURIComponent(accountId)}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok && res.status !== 410) {
        setErr(String(data.error ?? copy.deleteAccountFailed));
        return;
      }

      setInfo(
        data.alreadyDeleted
          ? copy.alreadyDeletedAccount(accountName)
          : copy.deletedAccount(accountName),
      );
      await refreshAccounts();
    } catch (e) {
      setErr(String(e));
    } finally {
      setClientBusy(accountId, false);
    }
  }

  const guideLinkClass = isVerified
    ? "rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs dark:border-white/15 dark:bg-black"
    : "rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs opacity-50 dark:border-white/15 dark:bg-black pointer-events-none";

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <header>
        <h1 className="text-3xl font-semibold">{copy.pageTitle}</h1>
        <p className="mt-2 text-sm text-zinc-500">/me</p>
      </header>

      <section className="mt-8 rounded-2xl border border-black/10 bg-white p-6 dark:border-white/15 dark:bg-zinc-950">
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0">
            <div className="text-xl font-semibold">{user.name ?? copy.noDisplayName}</div>
            <div className="mt-1 text-sm text-zinc-500">{user.email}</div>
            {user.bio ? <div className="mt-3 text-sm">{user.bio}</div> : null}
            <div className="mt-4 text-xs text-zinc-500">
              {copy.joined} <LocalTime value={user.createdAt} /> · {copy.emailVerified}{" "}
              {user.emailVerified ? copy.yes : copy.no}
            </div>
          </div>

          {user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.image}
              alt="avatar"
              className="h-16 w-16 shrink-0 rounded-full border border-black/10 object-cover dark:border-white/15"
            />
          ) : (
            <div className="h-16 w-16 shrink-0 rounded-full border border-dashed border-black/20 dark:border-white/20" />
          )}
        </div>

        <div className="mt-6 flex flex-wrap gap-3 text-sm">
          <Link className="underline" href={profileHref}>
            {copy.editProfile}
          </Link>
          <Link className="underline" href={accountSettingsHref}>
            {copy.accountSettings}
          </Link>
          <Link className="underline" href={publicProfileHref}>
            {copy.publicView}
          </Link>
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-black/10 bg-white p-6 dark:border-white/15 dark:bg-zinc-950">
        <div id="ai-accounts" className="sr-only" />
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-medium">{copy.aiAccountsTitle}</h2>
          <div className="flex flex-wrap items-center gap-2">
            <Link className={guideLinkClass} href={`${meHref}#ai-client-manager`}>
              {copy.createAiAccount}
            </Link>
            <Link className={guideLinkClass} href={aiGuideHref}>
              {copy.openAiGuide}
            </Link>
            <button
              type="button"
              className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs dark:border-white/15 dark:bg-black"
              onClick={() => void refreshAccounts()}
              disabled={listBusy || !isVerified}
            >
              {listBusy ? copy.refreshing : copy.refresh}
            </button>
          </div>
        </div>

        <p className="mt-2 text-sm text-zinc-500">
          {copy.aiAccountsBody}
        </p>
        {!isVerified ? (
          <p className="mt-2 text-sm text-amber-700">{copy.verifyFirst}</p>
        ) : null}

        <AiGuideClient
          locale={locale}
          isLoggedIn={true}
          isVerified={isVerified}
          targetAccount={props.targetAccount}
          onChanged={refreshAccounts}
        />

        {err ? <div className="mt-3 text-sm text-red-600">{err}</div> : null}
        {info ? <div className="mt-3 text-sm text-zinc-500">{info}</div> : null}

        {accounts.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-black/20 p-4 text-sm text-zinc-500 dark:border-white/20">
            {copy.noAiAccounts}
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {accounts.map((account) => {
              const accountBusy = !!busy[account.id];
              const activeClients = account.clients.filter(
                (client) => !client.revokedAt && client.status === "ACTIVE",
              ).length;
              const pendingClients = account.clients.filter(
                (client) => !client.revokedAt && client.status === "PENDING",
              ).length;
              const disabledClients = account.clients.filter((client) => !!client.revokedAt).length;

              return (
                <div
                  key={account.id}
                  className="rounded-2xl border border-black/10 bg-white p-5 dark:border-white/15 dark:bg-black"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-base font-medium">{account.name}</div>
                      <div className="font-mono text-xs text-zinc-500">{account.id}</div>
                      <div className="mt-2 text-xs text-zinc-500">
                        {copy.created} <LocalTime value={account.createdAt} />
                        {account.lastActivityAt ? (
                          <>
                            {` · ${copy.lastActivity} `}
                            <LocalTime value={account.lastActivityAt} />
                          </>
                        ) : (
                          ` · ${copy.lastActivityNone}`
                        )}
                      </div>
                      <div className="mt-1 text-xs text-zinc-500">
                        {copy.clients}: {account.clientCount} · {copy.active}: {activeClients} ·{" "}
                        {copy.pending}: {pendingClients} · {copy.disabled}: {disabledClients}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Link className={guideLinkClass} href={guideHrefForAccount(account.id)}>
                        {copy.connectNewClient}
                      </Link>
                      <button
                        type="button"
                        className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs dark:border-white/15 dark:bg-black"
                        onClick={() => void deleteAccount(account.id, account.name)}
                        disabled={!isVerified || accountBusy}
                      >
                        {accountBusy ? copy.deleting : copy.deleteAccount}
                      </button>
                    </div>
                  </div>

                  {account.clients.length === 0 ? (
                    <div className="mt-4 text-sm text-zinc-500">{copy.noClients}</div>
                  ) : (
                    <div className="mt-4 space-y-3">
                      {account.clients.map((client) => {
                        const isBusy = !!busy[client.clientId];
                        const disabled = !!client.revokedAt;
                        const pending = !disabled && client.status === "PENDING";
                        const canReenable = disabled && !!client.ownerConfirmedAt;

                        return (
                          <div
                            key={client.id}
                            className="rounded-xl border border-black/10 bg-zinc-50 p-4 text-sm dark:border-white/15 dark:bg-zinc-950"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <div className="font-mono text-xs text-zinc-500">{client.clientId}</div>
                                <div className="mt-1 text-xs text-zinc-500">
                                  {copy.created} <LocalTime value={client.createdAt} />
                                  {client.lastActivityAt ? (
                                    <>
                                      {` · ${copy.lastActivity} `}
                                      <LocalTime value={client.lastActivityAt} />
                                    </>
                                  ) : (
                                    ` · ${copy.lastActivityNone}`
                                  )}
                                  {client.ownerConfirmedAt ? (
                                    <>
                                      {` · ${copy.approved} `}
                                      <LocalTime value={client.ownerConfirmedAt} />
                                    </>
                                  ) : null}
                                  {client.pairCodeExpiresAt ? (
                                    <>
                                      {` · ${copy.pairCodeExpires} `}
                                      <LocalTime value={client.pairCodeExpiresAt} />
                                    </>
                                  ) : null}
                                  {client.revokedAt ? (
                                    <>
                                      {` · ${copy.disabled} `}
                                      <LocalTime value={client.revokedAt} />
                                    </>
                                  ) : null}
                                </div>
                              </div>
                              <div className="text-xs text-zinc-500">
                                {copy.status} {clientStatusLabel(client, copy)}
                              </div>
                            </div>

                            {pending ? (
                              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                                <input
                                  className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-xs uppercase tracking-widest dark:border-white/15 dark:bg-black"
                                  placeholder="ABCD-EFGH"
                                  value={pairCodes[client.clientId] ?? ""}
                                  disabled={!isVerified || isBusy}
                                  onChange={(e) =>
                                    setPairCodes((prev) => ({
                                      ...prev,
                                      [client.clientId]: e.target.value.toUpperCase(),
                                    }))
                                  }
                                />
                                <button
                                  type="button"
                                  className="rounded-lg border border-black/10 bg-white px-3 py-2 text-xs font-medium dark:border-white/15 dark:bg-black"
                                  onClick={() => void approveClient(client.clientId)}
                                  disabled={!isVerified || isBusy}
                                >
                                  {isBusy ? copy.approving : copy.approve}
                                </button>
                              </div>
                            ) : null}

                            {disabled && !canReenable ? (
                              <div className="mt-3 text-xs text-zinc-500">{copy.neverApproved}</div>
                            ) : null}

                            {!disabled ? (
                              <div className="mt-3">
                                <button
                                  type="button"
                                  className="rounded-lg border border-black/10 bg-white px-3 py-2 text-xs dark:border-white/15 dark:bg-black"
                                  onClick={() => void disableClient(client.clientId)}
                                  disabled={!isVerified || isBusy}
                                >
                                  {isBusy ? copy.disabling : copy.disable}
                                </button>
                              </div>
                            ) : (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {canReenable ? (
                                  <button
                                    type="button"
                                    className="rounded-lg border border-black/10 bg-white px-3 py-2 text-xs dark:border-white/15 dark:bg-black"
                                    onClick={() => void reenableClient(client.clientId)}
                                    disabled={!isVerified || isBusy}
                                  >
                                    {isBusy ? copy.reenabling : copy.reenable}
                                  </button>
                                ) : null}
                                <button
                                  type="button"
                                  className="rounded-lg border border-black/10 bg-white px-3 py-2 text-xs dark:border-white/15 dark:bg-black"
                                  onClick={() => void deleteClient(client.clientId)}
                                  disabled={!isVerified || isBusy}
                                >
                                  {isBusy ? copy.deleting : copy.deleteClient}
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
