"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [devLink, setDevLink] = useState<string | null>(null);

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <h1 className="text-3xl font-semibold">Login</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Members can rate articles and request new entries.
      </p>

      <button
        className="mt-6 w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-medium dark:border-white/15 dark:bg-zinc-950"
        onClick={() => signIn("google", { callbackUrl: "/" })}
      >
        Continue with Google
      </button>

      <div className="my-6 text-center text-xs text-zinc-500">or</div>

      <form
        className="flex flex-col gap-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setError(null);
          const res = await signIn("credentials", {
            email,
            password,
            redirect: false,
          });
          if (res?.error) {
            setError("Login failed (check email verification + password)");
          setInfo(null);
          setDevLink(null);
            return;
          }
          window.location.href = "/";
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
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <div className="text-sm text-red-600">{error}</div>}
        {info && <div className="text-sm text-zinc-600 dark:text-zinc-400">{info}</div>}
        {devLink ? (
          <div className="rounded-xl border border-black/10 bg-white p-3 text-xs dark:border-white/15 dark:bg-zinc-950">
            <div className="text-zinc-500">Dev verify link</div>
            <a className="mt-1 block break-all underline" href={devLink}>
              {devLink}
            </a>
          </div>
        ) : null}
        <button className="rounded-xl bg-black px-4 py-3 text-sm font-medium text-white dark:bg-white dark:text-black">
          Sign in
        </button>
      </form>

      <div className="mt-6 flex flex-col gap-2 text-sm text-zinc-600 dark:text-zinc-400">
        <p>
          No account? <a className="underline" href="/signup">Sign up</a>
        </p>
        <button
          type="button"
          className="self-start underline"
          onClick={async () => {
            setError(null);
            setInfo(null);
            setDevLink(null);
            if (!email.trim()) {
              setInfo("Enter your email above to resend verification.");
              return;
            }
            const res = await fetch("/api/auth/resend", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
              setError(data.error ?? "Failed to resend");
              return;
            }
            if (data.devVerifyUrl) {
              setDevLink(String(data.devVerifyUrl));
              setInfo("SMTP not configured. Dev verification link is shown above.");
            } else {
              setInfo("If the account exists and is unverified, a link was sent.");
            }
          }}
        >
          Resend verification
        </button>
      </div>
    </main>
  );
}
