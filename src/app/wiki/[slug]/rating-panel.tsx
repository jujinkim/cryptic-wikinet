"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { getSiteCopy } from "@/lib/site-copy";
import { getLocaleFromPathname, withSiteLocale } from "@/lib/site-locale";

type Verdict = "GOOD" | "BAD";

type RatingCounts = Record<Verdict, number>;

const VERDICT_LABELS: Record<Verdict, string> = {
  GOOD: "Good",
  BAD: "Bad",
};

export default function RatingPanel(props: {
  slug: string;
  initialCounts: RatingCounts;
  initialMine: Verdict | null;
  viewerUserId: string | null;
  viewerVerified: boolean;
}) {
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const copy = getSiteCopy(locale);
  const [counts, setCounts] = useState<RatingCounts>(props.initialCounts);
  const [mine, setMine] = useState<Verdict | null>(props.initialMine);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const loggedIn = !!props.viewerUserId;
  const canRate = loggedIn && props.viewerVerified;

  async function applyVerdict(next: Verdict) {
    if (!canRate || busy) return;
    setBusy(true);
    setStatus(null);

    try {
      const res = await fetch(`/api/articles/${props.slug}/rating`, {
        method: mine === next ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: mine === next ? undefined : JSON.stringify({ verdict: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus(data?.error ?? "Failed to save rating");
        return;
      }

      const nextCounts = data?.counts as Partial<RatingCounts> | undefined;
      const nextMine = (data?.mine ?? null) as Verdict | null;

      if (nextCounts) {
        setCounts({
          GOOD: Number(nextCounts.GOOD ?? 0),
          BAD: Number(nextCounts.BAD ?? 0),
        });
      }
      setMine(nextMine);
      setStatus(nextMine ? `Saved: ${VERDICT_LABELS[nextMine]}` : "Rating cleared");
    } catch {
      setStatus("Failed to save rating");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-black/10 bg-white p-5 dark:border-white/15 dark:bg-zinc-950">
      <div className="text-xs font-medium tracking-wide text-zinc-500">RATING</div>
      <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
        One click applies your rating. Click the same choice again to clear it.
      </p>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        {(["GOOD", "BAD"] as const).map((verdict) => {
          const active = mine === verdict;
          return (
            <button
              key={verdict}
              type="button"
              disabled={!canRate || busy}
              onClick={() => applyVerdict(verdict)}
              className={
                "rounded-2xl border px-4 py-3 text-left transition " +
                (active
                  ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
                  : "border-black/10 bg-zinc-50 text-zinc-900 hover:bg-zinc-100 dark:border-white/15 dark:bg-black dark:text-zinc-100 dark:hover:bg-zinc-900") +
                (!canRate || busy ? " opacity-60" : "")
              }
            >
              <div className="text-sm font-medium">{VERDICT_LABELS[verdict]}</div>
              <div className={`mt-1 text-xs ${active ? "text-white/80 dark:text-black/70" : "text-zinc-500"}`}>
                {counts[verdict]} votes
              </div>
            </button>
          );
        })}
      </div>

      {status ? <div className="mt-3 text-xs text-zinc-500">{status}</div> : null}

      {!loggedIn ? (
        <div className="mt-3 text-xs text-zinc-500">
          Verified members only. <Link className="underline" href={withSiteLocale("/login", locale)}>{copy.auth.login}</Link>
        </div>
      ) : !props.viewerVerified ? (
        <div className="mt-3 text-xs text-zinc-500">
          {copy.common.emailVerificationRequired}{" "}
          <Link className="underline" href={withSiteLocale("/settings/profile", locale)}>
            {copy.common.goToProfileSettings}
          </Link>
        </div>
      ) : null}
    </section>
  );
}
