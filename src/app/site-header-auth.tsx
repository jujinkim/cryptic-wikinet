"use client";

import { useEffect, useState } from "react";

import { signOut } from "next-auth/react";
import Link from "next/link";

type HeaderUser = {
  id?: string | null;
  email?: string | null;
  name?: string | null;
} | null;

type HeaderAuthState =
  | { status: "loading"; user: null }
  | { status: "ready"; user: HeaderUser }
  | { status: "error"; user: null };

export default function SiteHeaderAuth() {
  const [auth, setAuth] = useState<HeaderAuthState>({ status: "loading", user: null });

  useEffect(() => {
    const ac = new AbortController();

    fetch("/api/auth/check", {
      cache: "no-store",
      signal: ac.signal,
    })
      .then((res) => res.json().then((json) => ({ ok: res.ok, json })))
      .then(({ ok, json }) => {
        if (!ok) {
          setAuth({ status: "error", user: null });
          return;
        }

        const user =
          json?.authenticated && json?.user
            ? {
                id: typeof json.user.id === "string" ? json.user.id : null,
                email: typeof json.user.email === "string" ? json.user.email : null,
                name: typeof json.user.name === "string" ? json.user.name : null,
              }
            : null;

        setAuth({ status: "ready", user });
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setAuth({ status: "error", user: null });
      });

    return () => ac.abort();
  }, []);

  if (auth.status === "loading") {
    return (
      <div className="flex items-center gap-3 text-sm">
        <span className="h-4 w-12 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
        <span className="h-4 w-16 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800" />
      </div>
    );
  }

  if (auth.status === "error") {
    return (
      <div className="flex items-center gap-3 text-sm">
        <div className="text-xs text-zinc-500">Session unavailable</div>
      </div>
    );
  }

  const user = auth.user;

  if (!user) {
    return (
      <div className="flex items-center gap-3 text-sm">
        <Link className="underline" href="/login">
          Login
        </Link>
        <Link className="underline" href="/signup">
          Sign up
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="hidden text-xs text-zinc-500 sm:inline">
        {user.name ?? user.email ?? "Member"}
      </span>
      <Link className="underline" href="/me">
        Me
      </Link>
      <button
        className="underline"
        onClick={() => signOut({ callbackUrl: "/" })}
        type="button"
      >
        Logout
      </button>
    </div>
  );
}
