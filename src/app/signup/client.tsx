"use client";

import { useState } from "react";

export default function SignupClient() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [devLink, setDevLink] = useState<string | null>(null);

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <h1 className="text-3xl font-semibold">Sign up</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Email + password. We&apos;ll send a verification link.
      </p>

      <form
        className="mt-6 flex flex-col gap-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setStatus(null);
          setDevLink(null);
          const res = await fetch("/api/auth/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            setStatus(data.error ?? "Signup failed");
            return;
          }

          if (data.devVerifyUrl) {
            setDevLink(String(data.devVerifyUrl));
            setStatus(
              "SMTP not configured. Dev verification link is shown below.",
            );
          } else {
            setStatus("Check your email for a verification link.");
          }
        }}
      >
        <input
          className="rounded-xl border border-black/10 bg-white px-4 py-3 text-sm dark:border-white/15 dark:bg-zinc-950"
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="rounded-xl border border-black/10 bg-white px-4 py-3 text-sm dark:border-white/15 dark:bg-zinc-950"
          placeholder="Password (min 8 chars)"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {status ? (
          <div className="text-sm text-zinc-700 dark:text-zinc-300">{status}</div>
        ) : null}
        {devLink ? (
          <div className="rounded-xl border border-black/10 bg-white p-3 text-xs dark:border-white/15 dark:bg-zinc-950">
            <div className="text-zinc-500">Dev verify link</div>
            <a className="mt-1 block break-all underline" href={devLink}>
              {devLink}
            </a>
          </div>
        ) : null}

        <button className="rounded-xl bg-black px-4 py-3 text-sm font-medium text-white dark:bg-white dark:text-black">
          Create account
        </button>
      </form>

      <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">
        Already verified? <a className="underline" href="/login">Login</a>
      </p>
    </main>
  );
}
