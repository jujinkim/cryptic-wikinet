"use client";

import { useEffect, useState } from "react";

type Item = {
  id: string;
  targetType: string;
  targetRef: string;
  status: "OPEN" | "RESOLVED";
  createdAt: string;
  resolvedAt: string | null;
  canViewDetails: boolean;
  reason: string | null;
  reporter: { id: string; email: string; name: string | null } | null;
  resolvedBy: { id: string; email: string; name: string | null } | null;
};

export default function ReportsClient() {
  const [status, setStatus] = useState<"OPEN" | "RESOLVED">("OPEN");
  const [items, setItems] = useState<Item[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setErr(null);
    const res = await fetch(`/api/reports?status=${status}`);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(data.error ?? "Failed to load");
      return;
    }
    setIsAdmin(!!data.isAdmin);
    setItems(Array.isArray(data.items) ? data.items : []);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  async function toggleResolve(id: string, next: "OPEN" | "RESOLVED") {
    const res = await fetch(`/api/reports/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(data.error ?? "Failed");
      return;
    }
    await load();
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Reports</h1>
          <p className="mt-2 text-sm text-zinc-500">
            Members can browse reports. Details are visible only to admins or the reporter.
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <button
            className={status === "OPEN" ? "font-medium underline" : "underline"}
            onClick={() => setStatus("OPEN")}
            type="button"
          >
            Open
          </button>
          <button
            className={status === "RESOLVED" ? "font-medium underline" : "underline"}
            onClick={() => setStatus("RESOLVED")}
            type="button"
          >
            Resolved
          </button>
        </div>
      </header>

      {err ? <div className="mt-8 text-sm text-zinc-500">{err}</div> : null}

      {items.length === 0 ? (
        <div className="mt-8 text-sm text-zinc-500">No reports.</div>
      ) : (
        <ul className="mt-8 space-y-3">
          {items.map((r) => (
            <li key={r.id} className="rounded-xl border border-black/10 p-4 dark:border-white/15">
              <div className="text-xs text-zinc-500">
                {new Date(r.createdAt).toLocaleString()} · {r.status}
                {r.resolvedAt ? ` · resolved ${new Date(r.resolvedAt).toLocaleString()}` : ""}
              </div>
              <div className="mt-1 text-sm font-medium">
                {r.targetType} · {r.targetRef}
              </div>

              {r.canViewDetails ? (
                <>
                  {r.reason ? <div className="mt-2 text-sm">{r.reason}</div> : null}
                  {r.reporter ? (
                    <div className="mt-2 text-xs text-zinc-500">
                      by {r.reporter.name ?? r.reporter.email}
                      {r.resolvedBy ? ` · resolved by ${r.resolvedBy.name ?? r.resolvedBy.email}` : ""}
                    </div>
                  ) : null}
                </>
              ) : (
                <div className="mt-2 text-xs text-zinc-500">Details hidden.</div>
              )}

              <div className="mt-3 flex items-center justify-between gap-4">
                <div className="text-xs text-zinc-500">Report ID: {r.id}</div>
                {isAdmin ? (
                  <button
                    className="rounded-md border border-black/10 px-2 py-1 text-xs dark:border-white/15"
                    type="button"
                    onClick={() =>
                      toggleResolve(r.id, r.status === "OPEN" ? "RESOLVED" : "OPEN")
                    }
                  >
                    {r.status === "OPEN" ? "Resolve" : "Reopen"}
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
