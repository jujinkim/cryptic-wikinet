"use client";

import { useState } from "react";

export default function ProfileSettingsClient(props: {
  initial: { name: string; bio: string; image: string };
}) {
  const [name, setName] = useState(props.initial.name);
  const [bio, setBio] = useState(props.initial.bio);
  const [image, setImage] = useState(props.initial.image);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    setMsg(null);
    setErr(null);
    try {
      const res = await fetch("/api/me/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, bio, image }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(data.error ?? "Failed");
        return;
      }
      setMsg("Saved.");
    } catch (e) {
      setErr(String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-3xl font-semibold">Profile settings</h1>
      <p className="mt-2 text-sm text-zinc-500">Change display name / bio / avatar URL.</p>

      <div className="mt-8 flex flex-col gap-3">
        <label className="text-sm">
          <div className="mb-1 text-xs text-zinc-500">Display name</div>
          <input
            className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm dark:border-white/15 dark:bg-zinc-950"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
          />
        </label>

        <label className="text-sm">
          <div className="mb-1 text-xs text-zinc-500">Bio</div>
          <textarea
            className="min-h-24 w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm dark:border-white/15 dark:bg-zinc-950"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={500}
          />
        </label>

        <label className="text-sm">
          <div className="mb-1 text-xs text-zinc-500">Avatar image URL</div>
          <input
            className="w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm dark:border-white/15 dark:bg-zinc-950"
            value={image}
            onChange={(e) => setImage(e.target.value)}
            placeholder="https://..."
          />
        </label>

        {err ? <div className="text-sm text-red-600">{err}</div> : null}
        {msg ? <div className="text-sm text-zinc-500">{msg}</div> : null}

        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="mt-2 rounded-xl bg-black px-4 py-3 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </main>
  );
}
