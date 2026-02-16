"use client";

import { useState } from "react";

export default function AccountSettingsClient(props: {
  canChangePassword: boolean;
}) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    setMsg(null);
    setErr(null);
    try {
      const res = await fetch("/api/me/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(data.error ?? "Failed");
        return;
      }
      setMsg("Password updated.");
      setCurrent("");
      setNext("");
    } catch (e) {
      setErr(String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-3xl font-semibold">Account settings</h1>

      {!props.canChangePassword ? (
        <div className="mt-8 rounded-xl border border-black/10 bg-white p-4 text-sm text-zinc-600 dark:border-white/15 dark:bg-zinc-950 dark:text-zinc-400">
          Password change is not available for accounts without an email/password credential yet.
        </div>
      ) : (
        <section className="mt-8 rounded-2xl border border-black/10 bg-white p-6 dark:border-white/15 dark:bg-zinc-950">
          <h2 className="text-lg font-medium">Change password</h2>
          <div className="mt-4 flex flex-col gap-3">
            <input
              className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm dark:border-white/15 dark:bg-black"
              placeholder="Current password"
              type="password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
            />
            <input
              className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm dark:border-white/15 dark:bg-black"
              placeholder="New password (min 8 chars)"
              type="password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
            />

            {err ? <div className="text-sm text-red-600">{err}</div> : null}
            {msg ? <div className="text-sm text-zinc-500">{msg}</div> : null}

            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="mt-2 rounded-xl bg-black px-4 py-3 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
            >
              {saving ? "Saving…" : "Update password"}
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
