"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import Link from "next/link";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import LocalTime from "@/components/local-time";

type CatalogItem = {
  slug: string;
  title: string;
  updatedAt: string;
  tags?: string[];
  type?: string | null;
  status?: string | null;
};

type ApprovedTag = {
  key: string;
  label: string;
};

const TYPE_OPTIONS = ["entity", "phenomenon", "object", "place", "protocol", "event"] as const;
const STATUS_OPTIONS = ["unverified", "recurring", "contained", "dormant", "unknown"] as const;
const RECENT_LIMIT = 50;

function buildCatalogHref(filters: {
  query?: string;
  tag?: string;
  type?: string;
  status?: string;
}) {
  const sp = new URLSearchParams();
  if (filters.query?.trim()) sp.set("query", filters.query.trim());
  if (filters.tag?.trim()) sp.set("tag", filters.tag.trim());
  if (filters.type?.trim()) sp.set("type", filters.type.trim());
  if (filters.status?.trim()) sp.set("status", filters.status.trim());
  const qs = sp.toString();
  return qs ? `/catalog?${qs}` : "/catalog";
}

function buildArticlesApiUrl(filters: {
  query?: string;
  tag?: string;
  type?: string;
  status?: string;
}) {
  const sp = new URLSearchParams();
  if (filters.query?.trim()) sp.set("query", filters.query.trim());
  if (filters.tag?.trim()) sp.set("tag", filters.tag.trim());
  if (filters.type?.trim()) sp.set("type", filters.type.trim());
  if (filters.status?.trim()) sp.set("status", filters.status.trim());
  const qs = sp.toString();
  return qs ? `/api/articles?${qs}` : "/api/articles";
}

function sidebarButtonClass(active: boolean) {
  return (
    "w-full rounded-xl border px-3 py-2 text-left text-sm transition " +
    (active
      ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
      : "border-black/10 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-white/15 dark:bg-zinc-950 dark:text-zinc-200 dark:hover:bg-zinc-900")
  );
}

function tagPillClass(active: boolean) {
  return (
    "rounded-full border px-2 py-1 text-[11px] transition " +
    (active
      ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
      : "border-black/10 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-white/15 dark:bg-black dark:text-zinc-200 dark:hover:bg-zinc-900")
  );
}

export default function CatalogClient(props: {
  initialItems: CatalogItem[];
  approvedTags: ApprovedTag[];
  initialQuery: string;
  initialTag: string;
  initialType: string;
  initialStatus: string;
}) {
  const [query, setQuery] = useState(props.initialQuery);
  const [tag, setTag] = useState(props.initialTag);
  const [type, setType] = useState(props.initialType);
  const [status, setStatus] = useState(props.initialStatus);
  const [items, setItems] = useState(props.initialItems);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const deferredQuery = useDeferredValue(query);
  const firstLoadRef = useRef(true);

  const apiUrl = useMemo(
    () =>
      buildArticlesApiUrl({
        query: deferredQuery,
        tag,
        type,
        status,
      }),
    [deferredQuery, tag, type, status],
  );

  const browserUrl = useMemo(
    () =>
      buildCatalogHref({
        query: deferredQuery,
        tag,
        type,
        status,
      }),
    [deferredQuery, tag, type, status],
  );

  useEffect(() => {
    globalThis.history.replaceState({}, "", browserUrl);
  }, [browserUrl]);

  useEffect(() => {
    if (firstLoadRef.current) {
      firstLoadRef.current = false;
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(apiUrl)
      .then((r) => r.json().then((j) => ({ ok: r.ok, j })))
      .then(({ ok, j }) => {
        if (cancelled) return;
        if (!ok) {
          setError(j?.error ?? "Failed to load catalog");
          setItems([]);
          return;
        }
        setItems(Array.isArray(j.items) ? (j.items as CatalogItem[]) : []);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(String(err));
        setItems([]);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [apiUrl]);

  function resetFilters() {
    setQuery("");
    setTag("");
    setType("");
    setStatus("");
  }

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-2xl border border-black/10 bg-white p-5 dark:border-white/15 dark:bg-zinc-950">
          <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Catalog Menu
          </div>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Browse the most recently updated public entries by type, status, or tag.
          </p>

          <div className="mt-4">
            <button type="button" className={sidebarButtonClass(!query && !tag && !type && !status)} onClick={resetFilters}>
              All entries
            </button>
          </div>

          <div className="mt-5 space-y-2">
            <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">Types</div>
            <div className="space-y-2">
              {TYPE_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={sidebarButtonClass(type === option)}
                  onClick={() => setType((current) => (current === option ? "" : option))}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 space-y-2">
            <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">Status</div>
            <div className="space-y-2">
              {STATUS_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={sidebarButtonClass(status === option)}
                  onClick={() => setStatus((current) => (current === option ? "" : option))}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 space-y-2">
            <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">Tags</div>
            <div className="max-h-72 overflow-y-auto pr-1">
              <div className="flex flex-wrap gap-2">
                {props.approvedTags.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    className={tagPillClass(tag === item.key)}
                    onClick={() => setTag((current) => (current === item.key ? "" : item.key))}
                    title={item.key}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </aside>

      <section className="rounded-2xl border border-black/10 bg-white p-6 dark:border-white/15 dark:bg-zinc-950">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Catalog</h1>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Recent public dossier entries, limited to the newest {RECENT_LIMIT} results.
            </p>
          </div>

          <div className="w-full sm:max-w-sm">
            <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-zinc-500">
              Search catalog
            </label>
            <input
              className="w-full rounded-xl border border-black/10 bg-white px-4 py-2 text-sm dark:border-white/15 dark:bg-black"
              placeholder="Search by title or slug"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
          {query ? <span className="rounded-full border border-black/10 px-2 py-1 dark:border-white/15">query:{query}</span> : null}
          {type ? <span className="rounded-full border border-black/10 px-2 py-1 dark:border-white/15">type:{type}</span> : null}
          {status ? <span className="rounded-full border border-black/10 px-2 py-1 dark:border-white/15">status:{status}</span> : null}
          {tag ? <span className="rounded-full border border-black/10 px-2 py-1 dark:border-white/15">tag:{tag}</span> : null}
          {query || type || status || tag ? (
            <button type="button" className="underline" onClick={resetFilters}>
              clear
            </button>
          ) : null}
        </div>

        <div className="mt-6">
          {loading ? (
            <div className="text-sm text-zinc-500">Loading…</div>
          ) : error ? (
            <div className="text-sm text-red-600">{error}</div>
          ) : items.length === 0 ? (
            <div className="text-sm text-zinc-500">No matching entries.</div>
          ) : (
            <ul className="divide-y divide-black/5 dark:divide-white/10">
              {items.map((item) => (
                <li key={item.slug} className="py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <Link
                        className="block truncate font-medium underline-offset-2 hover:underline"
                        href={`/wiki/${item.slug}`}
                      >
                        {item.title}
                      </Link>
                      <div className="mt-1 text-xs text-zinc-500">/{item.slug}</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {item.type ? (
                          <button
                            type="button"
                            className={tagPillClass(type === item.type)}
                            onClick={() => setType((current) => (current === item.type ? "" : item.type ?? ""))}
                          >
                            {item.type}
                          </button>
                        ) : null}
                        {item.status ? (
                          <button
                            type="button"
                            className={tagPillClass(status === item.status)}
                            onClick={() =>
                              setStatus((current) => (current === item.status ? "" : item.status ?? ""))
                            }
                          >
                            {item.status}
                          </button>
                        ) : null}
                        {(item.tags ?? []).slice(0, 8).map((itemTag) => (
                          <button
                            key={`${item.slug}:${itemTag}`}
                            type="button"
                            className={tagPillClass(tag === itemTag)}
                            onClick={() => setTag((current) => (current === itemTag ? "" : itemTag))}
                          >
                            {itemTag}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="shrink-0 text-right text-xs text-zinc-500">
                      <LocalTime value={item.updatedAt} />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
