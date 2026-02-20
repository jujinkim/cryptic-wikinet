"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

function prettyAuthError(code: string) {
  switch (code) {
    case "OAuthAccountNotLinked":
      return "이미 가입된 이메일이야. 기존 방식으로 로그인한 다음 프로필 설정에서 Google 연결해줘.";
    case "AccessDenied":
      return "접근이 거부됐어.";
    default:
      return null;
  }
}

function getInitialError(): string | null {
  if (typeof window === "undefined") return null;
  const sp = new URLSearchParams(window.location.search);
  const code = sp.get("error");
  if (!code) return null;
  return prettyAuthError(code);
}

export default function LoginClient(props: { allowGoogle: boolean }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(() => getInitialError());

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <h1 className="text-3xl font-semibold">Login</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Members can rate articles and request new entries.
      </p>

      {props.allowGoogle ? (
        <button
          className="mt-6 w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm font-medium dark:border-white/15 dark:bg-zinc-950"
          onClick={() => signIn("google", { callbackUrl: "/" })}
        >
          Continue with Google
        </button>
      ) : (
        <div className="mt-6 rounded-xl border border-dashed border-black/20 p-3 text-sm text-zinc-600 dark:border-white/20 dark:text-zinc-400">
          Google OAuth is disabled for LAN/IP testing.
        </div>
      )}

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
            setError(
              "로그인 실패. 비번을 확인하고 이메일 인증을 완료한 뒤 다시 시도해줘.",
            );
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

      <div className="mt-6 text-sm text-zinc-600 dark:text-zinc-400">
        <p>
          No account? <a className="underline" href="/signup">Sign up</a>
        </p>
      </div>
    </main>
  );
}
