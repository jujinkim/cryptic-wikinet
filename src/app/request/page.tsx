import { Suspense } from "react";
import RequestClient from "@/app/request/RequestClient";

export const dynamic = "force-dynamic";

export default function RequestPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-zinc-500">Loading…</div>}>
      <RequestClient />
    </Suspense>
  );
}
