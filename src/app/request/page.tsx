import { Suspense } from "react";
import RequestClient from "@/app/request/RequestClient";
import RequestPageSkeleton from "@/app/request/RequestPageSkeleton";

export default function RequestPage() {
  return (
    <Suspense fallback={<RequestPageSkeleton />}>
      <RequestClient />
    </Suspense>
  );
}
