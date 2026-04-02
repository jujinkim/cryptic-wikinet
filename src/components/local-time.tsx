"use client";

import { useMemo, useSyncExternalStore } from "react";

type LocalTimeProps = {
  value: string | number | Date | null | undefined;
  mode?: "datetime" | "date";
  className?: string;
  empty?: string;
};

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function toIso(value: LocalTimeProps["value"]) {
  if (value == null) return null;

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return value.toISOString();
  }

  if (typeof value === "number") {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date.toISOString();
  }

  const trimmed = String(value).trim();
  if (!trimmed) return null;
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function formatUtcFallback(epochMs: number, mode: NonNullable<LocalTimeProps["mode"]>) {
  const date = new Date(epochMs);
  const y = date.getUTCFullYear();
  const m = pad(date.getUTCMonth() + 1);
  const d = pad(date.getUTCDate());

  if (mode === "date") return `${y}-${m}-${d}`;

  const hh = pad(date.getUTCHours());
  const mm = pad(date.getUTCMinutes());
  return `${y}-${m}-${d} ${hh}:${mm} UTC`;
}

function formatLocal(epochMs: number, mode: NonNullable<LocalTimeProps["mode"]>) {
  const date = new Date(epochMs);
  if (mode === "date") return date.toLocaleDateString();
  return date.toLocaleString();
}

function subscribe() {
  return () => {};
}

function getClientTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || null;
}

function getServerTimeZone() {
  return null;
}

export default function LocalTime(props: LocalTimeProps) {
  const mode = props.mode ?? "datetime";
  const empty = props.empty ?? "-";
  const iso = useMemo(() => toIso(props.value), [props.value]);
  const epochMs = useMemo(() => {
    if (!iso) return null;
    const date = new Date(iso);
    return Number.isNaN(date.getTime()) ? null : date.getTime();
  }, [iso]);
  const timeZone = useSyncExternalStore(subscribe, getClientTimeZone, getServerTimeZone);
  const text =
    epochMs == null
      ? empty
      : timeZone
        ? formatLocal(epochMs, mode)
        : formatUtcFallback(epochMs, mode);

  return (
    <time suppressHydrationWarning className={props.className} dateTime={iso ?? undefined} title={iso ?? undefined}>
      {text}
    </time>
  );
}
