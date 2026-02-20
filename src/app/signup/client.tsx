"use client";

import { useState } from "react";

export default function SignupClient() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);

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
          const res = await fetch("/api/auth/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            const msg = String(data.error ?? "Signup failed");
            if (res.status === 409) {
              setStatus("이미 가입된 이메일이야. 로그인 페이지로 가줘.");
              return;
            }
            setStatus(msg);
            return;
          }

          const mode = String(data.deliveryMode ?? "smtp");
          const toastMsg =
            mode === "failed"
              ? "회원가입 완료. 메일 인증이 필요해. 인증 메일 전송에 실패했으면 프로필 설정에서 재발송해줘."
              : "회원가입 완료. 메일 인증이 필요해.";
          globalThis.sessionStorage?.setItem("cw.toast", toastMsg);
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
          placeholder="Password (min 8 chars)"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {status ? (
          <div className="text-sm text-zinc-700 dark:text-zinc-300">{status}</div>
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
