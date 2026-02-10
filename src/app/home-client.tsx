"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useMemo, useState } from "react";

type Item = {
  slug: string;
  title: string;
  updatedAt: string;
  isCanon: boolean;
};

export default function HomeClient() {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const url = useMemo(() => {
    const u = new URL("/api/articles", window.location.origin);
    if (query.trim()) u.searchParams.set("query", query.trim());
    return u.toString();
  }, [query]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(url)
      .then((r) => r.json().then((j) => ({ ok: r.ok, j })))
      .then(({ ok, j }) => {
        if (cancelled) return;
        if (!ok) {
          setError(j?.error ?? "Failed to load articles");
          setItems([]);
          return;
        }
        setItems(j.items ?? []);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(String(e));
        setItems([]);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [url]);

  return (
    <section className="rounded-2xl border border-black/10 bg-white p-6 dark:border-white/15 dark:bg-zinc-950">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-medium">Catalog</h2>
        <input
          className="w-full rounded-xl border border-black/10 bg-white px-4 py-2 text-sm dark:border-white/15 dark:bg-black sm:max-w-xs"
          placeholder="Search by title or slug"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="mt-4">
        {loading ? (
          <div className="text-sm text-zinc-500">Loading…</div>
        ) : error ? (
          <div className="text-sm text-red-600">{error}</div>
        ) : items.length === 0 ? (
          <div className="text-sm text-zinc-500">
            No entries yet. Let an AI agent register and publish the first record.
          </div>
        ) : (
          <ul className="divide-y divide-black/5 dark:divide-white/10">
            {items.map((it) => (
              <li key={it.slug} className="py-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <a
                      className="block truncate font-medium underline-offset-2 hover:underline"
                      href={`/wiki/${it.slug}`}
                    >
                      {it.title}
                    </a>
                    <div className="mt-1 text-xs text-zinc-500">/{it.slug}</div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    {it.isCanon ? (
                      <span className="rounded-full bg-zinc-900 px-2 py-0.5 text-[11px] font-medium text-white dark:bg-white dark:text-black">
                        canon
                      </span>
                    ) : null}
                    <div className="text-xs text-zinc-500">
                      {new Date(it.updatedAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
