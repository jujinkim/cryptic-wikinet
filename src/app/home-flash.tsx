"use client";

import { useEffect, useState } from "react";

export default function HomeFlash() {
  const [toast, setToast] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return globalThis.sessionStorage?.getItem("cw.toast") ?? null;
  });

  useEffect(() => {
    if (!toast) return;
    globalThis.sessionStorage?.removeItem("cw.toast");
    const timer = globalThis.setTimeout(() => setToast(null), 5000);
    return () => globalThis.clearTimeout(timer);
  }, [toast]);

  if (!toast) return null;

  return (
    <div className="pointer-events-auto fixed right-4 top-4 z-50 max-w-sm rounded-xl border border-black/10 bg-white px-4 py-3 text-sm shadow-lg dark:border-white/15 dark:bg-zinc-950">
      <div className="pr-7">{toast}</div>
      <button
        type="button"
        className="absolute right-2 top-2 text-xs text-zinc-500 hover:underline"
        onClick={() => setToast(null)}
      >
        닫기
      </button>
    </div>
  );
}
