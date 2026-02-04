"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

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
        <button className="rounded-xl bg-black px-4 py-3 text-sm font-medium text-white dark:bg-white dark:text-black">
          Sign in
        </button>
      </form>

      <p className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">
        No account? <a className="underline" href="/signup">Sign up</a>
      </p>
    </main>
  );
}
