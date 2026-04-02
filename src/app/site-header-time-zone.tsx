"use client";

import { useMemo, useSyncExternalStore } from "react";

const FIXED_ZONE_LABELS: Record<string, string> = {
  "Asia/Seoul": "KST",
  "Asia/Tokyo": "JST",
  "Asia/Singapore": "SGT",
  "Asia/Hong_Kong": "HKT",
};

function subscribe() {
  return () => {};
}

function getClientTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || null;
}

function getServerTimeZone() {
  return null;
}

function formatZoneLabel(timeZone: string | null) {
  if (!timeZone) return "UTC";
  if (FIXED_ZONE_LABELS[timeZone]) return FIXED_ZONE_LABELS[timeZone];

  const shortLabel = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "short",
  })
    .formatToParts(new Date())
    .find((part) => part.type === "timeZoneName")
    ?.value;

  if (shortLabel && !/^GMT(?:[+-]\d{1,2}(?::\d{2})?)?$/.test(shortLabel)) {
    return shortLabel;
  }

  return shortLabel ?? timeZone.split("/").at(-1)?.replace(/_/g, " ") ?? "UTC";
}

export default function SiteHeaderTimeZone() {
  const timeZone = useSyncExternalStore(subscribe, getClientTimeZone, getServerTimeZone);
  const label = useMemo(() => formatZoneLabel(timeZone), [timeZone]);

  return (
    <span
      suppressHydrationWarning
      className="text-[10px] uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400"
      title={timeZone ?? "UTC"}
    >
      {label}
    </span>
  );
}
