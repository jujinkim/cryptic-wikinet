"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { getLocaleFromPathname, withSiteLocale } from "@/lib/site-locale";

export default function VerifyClient() {
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const sp = useSearchParams();
  const email = sp.get("email") ?? "";
  const token = sp.get("token") ?? "";
  const [status, setStatus] = useState("Verifying...");

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus(data.error ?? "Verification failed");
        return;
      }
      setStatus("Verified. You can log in now.");
    })();
  }, [email, token]);

  return (
    <main className="mx-auto max-w-md px-6 py-16">
      <h1 className="text-3xl font-semibold">Email verification</h1>
      <p className="mt-4 text-sm text-zinc-700 dark:text-zinc-300">{status}</p>
      <p className="mt-6 text-sm">
        <Link className="underline" href={withSiteLocale("/login", locale)}>
          Go to login
        </Link>
      </p>
    </main>
  );
}
