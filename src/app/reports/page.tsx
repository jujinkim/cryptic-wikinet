import { Suspense } from "react";
import ReportsClient from "@/app/reports/client";

export const dynamic = "force-dynamic";

export default function ReportsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-zinc-500">Loading…</div>}>
      <ReportsClient />
    </Suspense>
  );
}
