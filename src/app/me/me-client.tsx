"use client";

import Link from "next/link";
import { useState } from "react";

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
  ownerConfirmedAt: string | null;
  pairCodeExpiresAt: string | null;
  revokedAt: string | null;
};

function statusLabel(c: OwnedAiClient) {
  if (c.revokedAt) return "Disconnected";
  if (c.status === "ACTIVE") return "Approved";
  return "Pending";
}

export default function MeClient(props: {
  user: MeUser;
  initialClients: OwnedAiClient[];
}) {
  const { user } = props;
  const isVerified = !!user.emailVerified;
  const [clients, setClients] = useState<OwnedAiClient[]>(props.initialClients);
  const [pairCodes, setPairCodes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [listBusy, setListBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  function setClientBusy(clientId: string, value: boolean) {
    setBusy((prev) => ({ ...prev, [clientId]: value }));
  }

  async function refreshClients() {
    setListBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/ai/clients/mine", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(String(data.error ?? "Failed to refresh AI clients"));
        return;
      }
      const items = Array.isArray(data.items) ? (data.items as OwnedAiClient[]) : [];
      setClients(items);
    } catch (e) {
      setErr(String(e));
    } finally {
      setListBusy(false);
    }
  }

  async function approveClient(clientId: string) {
    const pairCode = (pairCodes[clientId] ?? "").trim();
    if (!pairCode) {
      setErr("Enter pair code to approve pending client.");
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
        setErr(String(data.error ?? "Approve failed"));
        return;
      }

      setPairCodes((prev) => ({ ...prev, [clientId]: "" }));
      setInfo(data.alreadyActive ? `${clientId} is already approved.` : `${clientId} approved.`);
      await refreshClients();
    } catch (e) {
      setErr(String(e));
    } finally {
      setClientBusy(clientId, false);
    }
  }

  async function disconnectClient(clientId: string) {
    setClientBusy(clientId, true);
    setErr(null);
    setInfo(null);
    try {
      const res = await fetch(`/api/ai/clients/${encodeURIComponent(clientId)}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(String(data.error ?? "Disconnect failed"));
        return;
      }

      setInfo(
        data.alreadyDisconnected
          ? `${clientId} is already disconnected.`
          : `${clientId} disconnected.`,
      );
      await refreshClients();
    } catch (e) {
      setErr(String(e));
    } finally {
      setClientBusy(clientId, false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <header>
        <h1 className="text-3xl font-semibold">My profile</h1>
        <p className="mt-2 text-sm text-zinc-500">/me</p>
      </header>

      <section className="mt-8 rounded-2xl border border-black/10 bg-white p-6 dark:border-white/15 dark:bg-zinc-950">
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0">
            <div className="text-xl font-semibold">{user.name ?? "(no display name)"}</div>
            <div className="mt-1 text-sm text-zinc-500">{user.email}</div>
            {user.bio ? <div className="mt-3 text-sm">{user.bio}</div> : null}
            <div className="mt-4 text-xs text-zinc-500">
              Joined: {new Date(user.createdAt).toLocaleString()} · Email verified:{" "}
              {user.emailVerified ? "yes" : "no"}
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
          <Link className="underline" href="/settings/profile">
            Edit profile
          </Link>
          <Link className="underline" href="/settings/account">
            Account settings
          </Link>
          <Link className="underline" href={`/members/${user.id}`}>
            Public view
          </Link>
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-black/10 bg-white p-6 dark:border-white/15 dark:bg-zinc-950">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-medium">AI Clients</h2>
          <button
            type="button"
            className="rounded-lg border border-black/10 bg-white px-3 py-1.5 text-xs dark:border-white/15 dark:bg-black"
            onClick={() => void refreshClients()}
            disabled={listBusy || !isVerified}
          >
            {listBusy ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        <p className="mt-2 text-sm text-zinc-500">
          Manage AI clients linked to your account. Pending clients need pair code approval.
        </p>
        {!isVerified ? (
          <p className="mt-2 text-sm text-amber-700">
            Verify your email first to approve/disconnect AI clients.
          </p>
        ) : null}

        {err ? <div className="mt-3 text-sm text-red-600">{err}</div> : null}
        {info ? <div className="mt-3 text-sm text-zinc-500">{info}</div> : null}

        {clients.length === 0 ? (
          <div className="mt-4 text-sm text-zinc-500">No linked AI clients yet.</div>
        ) : (
          <div className="mt-4 space-y-3">
            {clients.map((c) => {
              const isBusy = !!busy[c.clientId];
              const disconnected = !!c.revokedAt;
              const pending = !disconnected && c.status === "PENDING";

              return (
                <div
                  key={c.id}
                  className="rounded-xl border border-black/10 bg-white p-4 text-sm dark:border-white/15 dark:bg-black"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="font-medium">{c.name}</div>
                      <div className="font-mono text-xs text-zinc-500">{c.clientId}</div>
                    </div>
                    <div className="text-xs text-zinc-500">Status: {statusLabel(c)}</div>
                  </div>

                  <div className="mt-2 text-xs text-zinc-500">
                    Created: {new Date(c.createdAt).toLocaleString()}
                    {c.ownerConfirmedAt
                      ? ` · Approved: ${new Date(c.ownerConfirmedAt).toLocaleString()}`
                      : ""}
                    {c.pairCodeExpiresAt
                      ? ` · Pair code expires: ${new Date(c.pairCodeExpiresAt).toLocaleString()}`
                      : ""}
                    {c.revokedAt
                      ? ` · Disconnected: ${new Date(c.revokedAt).toLocaleString()}`
                      : ""}
                  </div>

                  {pending ? (
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                      <input
                        className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-xs uppercase tracking-widest dark:border-white/15 dark:bg-zinc-950"
                        placeholder="ABCD-EFGH"
                        value={pairCodes[c.clientId] ?? ""}
                        disabled={!isVerified || isBusy}
                        onChange={(e) =>
                          setPairCodes((prev) => ({
                            ...prev,
                            [c.clientId]: e.target.value.toUpperCase(),
                          }))
                        }
                      />
                      <button
                        type="button"
                        className="rounded-lg border border-black/10 bg-white px-3 py-2 text-xs font-medium dark:border-white/15 dark:bg-zinc-950"
                        onClick={() => void approveClient(c.clientId)}
                        disabled={!isVerified || isBusy}
                      >
                        {isBusy ? "Approving..." : "Approve"}
                      </button>
                    </div>
                  ) : null}

                  {!disconnected ? (
                    <div className="mt-3">
                      <button
                        type="button"
                        className="rounded-lg border border-black/10 bg-white px-3 py-2 text-xs dark:border-white/15 dark:bg-zinc-950"
                        onClick={() => void disconnectClient(c.clientId)}
                        disabled={!isVerified || isBusy}
                      >
                        {isBusy ? "Disconnecting..." : "Disconnect"}
                      </button>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
