import { Suspense } from "react";
import VerifyClient from "@/app/verify/VerifyClient";

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-zinc-500">Loading…</div>}>
      <VerifyClient />
    </Suspense>
  );
}
