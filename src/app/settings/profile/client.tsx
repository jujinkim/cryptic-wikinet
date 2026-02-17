"use client";

import { signIn } from "next-auth/react";
import { useEffect, useState } from "react";

export default function ProfileSettingsClient(props: {
  initial: { name: string; bio: string; image: string };
  allowGoogle: boolean;
  hasGoogle: boolean;
  email: string;
  emailVerified: boolean;
}) {
  const [name, setName] = useState(props.initial.name);
  const [bio, setBio] = useState(props.initial.bio);
  const [image, setImage] = useState(props.initial.image);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [verifyInfo, setVerifyInfo] = useState<string | null>(null);
  const [verifyErr, setVerifyErr] = useState<string | null>(null);
  const [verifyDevLink, setVerifyDevLink] = useState<string | null>(null);
  const [sendingVerify, setSendingVerify] = useState(false);

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const e = sp.get("error");
    if (e === "OAuthAccountNotLinked") {
      setErr("This Google account is already linked to a different user.");
    }
    if (sp.get("linked") === "1") {
      setMsg("Account linked.");
    }
  }, []);

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

  async function resendVerify() {
    setSendingVerify(true);
    setVerifyInfo(null);
    setVerifyErr(null);
    setVerifyDevLink(null);
    try {
      const res = await fetch("/api/auth/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: props.email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setVerifyErr(data.error ?? "Failed to resend");
        return;
      }
      if (data.devVerifyUrl) {
        setVerifyDevLink(String(data.devVerifyUrl));
        setVerifyInfo("SMTP not configured. Dev verification link is shown below.");
      } else {
        setVerifyInfo("If the account exists and is unverified, a link was sent.");
      }
    } catch (e) {
      setVerifyErr(String(e));
    } finally {
      setSendingVerify(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-3xl font-semibold">Profile settings</h1>
      <p className="mt-2 text-sm text-zinc-500">Change display name / bio / avatar URL.</p>

      <section className="mt-8 flex flex-col gap-3">
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
      </section>

      <section className="mt-12 rounded-2xl border border-black/10 bg-white p-6 dark:border-white/15 dark:bg-zinc-950">
        <h2 className="text-lg font-medium">Email verification</h2>
        <p className="mt-2 text-sm text-zinc-500">
          {props.emailVerified
            ? "Verified. You can do member-only actions (requests / forum writing / ratings)."
            : "Not verified yet. You can log in, but member-only actions are disabled until you verify."}
        </p>

        <div className="mt-4 flex items-center justify-between gap-4 text-sm">
          <div className="min-w-0">
            <div className="text-xs text-zinc-500">Email</div>
            <div className="truncate font-medium">{props.email}</div>
          </div>
          {!props.emailVerified ? (
            <button
              type="button"
              onClick={resendVerify}
              disabled={sendingVerify || !props.email}
              className="rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-medium dark:border-white/15 dark:bg-black disabled:opacity-50"
            >
              {sendingVerify ? "Sending…" : "Resend verification"}
            </button>
          ) : (
            <div className="text-xs text-zinc-500">ok</div>
          )}
        </div>

        {verifyErr ? <div className="mt-3 text-sm text-red-600">{verifyErr}</div> : null}
        {verifyInfo ? <div className="mt-3 text-sm text-zinc-500">{verifyInfo}</div> : null}

        {verifyDevLink ? (
          <div className="mt-3 rounded-xl border border-black/10 bg-white p-3 text-xs dark:border-white/15 dark:bg-zinc-950">
            <div className="text-zinc-500">Dev verify link</div>
            <a className="mt-1 block break-all underline" href={verifyDevLink}>
              {verifyDevLink}
            </a>
          </div>
        ) : null}
      </section>

      <section className="mt-12 rounded-2xl border border-black/10 bg-white p-6 dark:border-white/15 dark:bg-zinc-950">
        <h2 className="text-lg font-medium">Connected accounts</h2>
        <p className="mt-2 text-sm text-zinc-500">
          Link OAuth providers to your existing account.
        </p>

        <div className="mt-4 flex flex-col gap-3 text-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="font-medium">Google</div>
              <div className="text-xs text-zinc-500">
                {props.allowGoogle ? "available" : "disabled for LAN/IP origins"}
              </div>
            </div>

            {props.hasGoogle ? (
              <div className="text-xs text-zinc-500">connected</div>
            ) : (
              <button
                type="button"
                className="rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-medium dark:border-white/15 dark:bg-black disabled:opacity-50"
                disabled={!props.allowGoogle}
                onClick={() => signIn("google", { callbackUrl: "/settings/profile?linked=1" })}
              >
                Connect
              </button>
            )}
          </div>

          <div className="text-xs text-zinc-500">
            Future: Apple / GitHub / etc.
          </div>
        </div>
      </section>
    </main>
  );
}
