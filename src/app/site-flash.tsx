"use client";

import { useEffect, useMemo, useState } from "react";

export default function SiteFlash() {
  const [toast, setToast] = useState<string | null>(null);

  const initialToast = useMemo(() => {
    if (typeof window === "undefined") return null;
    return globalThis.sessionStorage?.getItem("cw.toast");
  }, []);

  useEffect(() => {
    setToast(initialToast);
  }, [initialToast]);

  useEffect(() => {
    if (!toast || typeof window === "undefined") return;
    globalThis.sessionStorage?.removeItem("cw.toast");
    const timer = globalThis.setTimeout(() => setToast(null), 5000);
    return () => globalThis.clearTimeout(timer);
  }, [toast]);

  if (!toast) return null;

  return (
    <div className="pointer-events-auto fixed right-4 top-4 z-[60] max-w-sm rounded-xl border border-black/10 bg-white px-4 py-3 text-sm shadow-lg dark:border-white/15 dark:bg-zinc-950">
      <div className="pr-7">{toast}</div>
      <button
        type="button"
        className="absolute right-2 top-2 text-xs text-zinc-500 hover:underline"
        onClick={() => setToast(null)}
      >
        Close
      </button>
    </div>
  );
}
