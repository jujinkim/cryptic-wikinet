"use client";

import { useEffect, useState } from "react";

import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { getSiteCopy } from "@/lib/site-copy";
import { getLocaleFromPathname, withSiteLocale } from "@/lib/site-locale";

type HeaderUser = {
  id?: string | null;
  email?: string | null;
  name?: string | null;
  role?: string | null;
} | null;

type HeaderAuthState =
  | { status: "loading"; user: null }
  | { status: "ready"; user: HeaderUser }
  | { status: "error"; user: null };

export default function SiteHeaderAuth() {
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const copy = getSiteCopy(locale);
  const homeHref = withSiteLocale("/", locale);
  const loginHref = withSiteLocale("/login", locale);
  const signupHref = withSiteLocale("/signup", locale);
  const meHref = withSiteLocale("/me", locale);
  const adminHref = withSiteLocale("/admin", locale);
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
                role: typeof json.user.role === "string" ? json.user.role : null,
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
      <div className="flex shrink-0 items-center gap-2 text-xs sm:gap-3 sm:text-sm">
        <span className="h-4 w-10 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800 sm:w-12" />
        <span className="h-4 w-14 animate-pulse rounded bg-zinc-200 dark:bg-zinc-800 sm:w-16" />
      </div>
    );
  }

  if (auth.status === "error") {
    return (
      <div className="flex shrink-0 items-center gap-2 text-xs sm:gap-3 sm:text-sm">
        <div className="text-xs text-zinc-500">{copy.auth.sessionUnavailable}</div>
      </div>
    );
  }

  const user = auth.user;

  if (!user) {
    return (
      <div className="flex shrink-0 items-center gap-2 text-xs sm:gap-3 sm:text-sm">
        <Link className="whitespace-nowrap underline" href={loginHref}>
          {copy.auth.login}
        </Link>
        <Link className="whitespace-nowrap underline" href={signupHref}>
          {copy.auth.signUp}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex shrink-0 items-center gap-2 text-xs sm:gap-3 sm:text-sm">
      <span className="hidden text-xs text-zinc-500 sm:inline">
        {user.name ?? user.email ?? copy.auth.member}
      </span>
      {user.role === "ADMIN" ? (
        <Link className="whitespace-nowrap underline" href={adminHref}>
          Admin
        </Link>
      ) : null}
      <Link className="whitespace-nowrap underline" href={meHref}>
        {copy.auth.me}
      </Link>
      <button
        className="whitespace-nowrap underline"
        onClick={() => signOut({ callbackUrl: homeHref })}
        type="button"
      >
        {copy.auth.logout}
      </button>
    </div>
  );
}
