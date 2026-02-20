import { Suspense } from "react";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import LoginClient from "@/app/login/client";

export const dynamic = "force-dynamic";

function isIpHost(hostname: string) {
  // IPv4 check (good enough for LAN)
  return /^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname);
}

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) {
    redirect("/");
  }

  const nextAuthUrl = process.env.NEXTAUTH_URL ?? "";
  let allowGoogle = true;

  try {
    const u = new URL(nextAuthUrl);
    allowGoogle = !isIpHost(u.hostname);
  } catch {
    // If misconfigured, be conservative and disable.
    allowGoogle = false;
  }

  return (
    <Suspense fallback={<div className="p-6 text-sm text-zinc-500">Loading…</div>}>
      <LoginClient allowGoogle={allowGoogle} />
    </Suspense>
  );
}
