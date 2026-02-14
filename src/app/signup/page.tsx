import { Suspense } from "react";
import SignupClient from "@/app/signup/client";

export const dynamic = "force-dynamic";

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-zinc-500">Loading…</div>}>
      <SignupClient />
    </Suspense>
  );
}
