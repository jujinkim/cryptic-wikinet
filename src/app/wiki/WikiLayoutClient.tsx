"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type { TocItem } from "@/lib/markdownToc";

type TagItem = {
  key: string;
  label: string;
  count: number;
};

type DocItem = {
  slug: string;
  title: string;
};

export default function WikiLayoutClient(props: {
  slug: string | null;
  toc: TocItem[];
  tags: TagItem[];
  children: React.ReactNode;
}) {
  const [side, setSide] = useState<"left" | "right">("left");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [docs, setDocs] = useState<DocItem[] | null>(null);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [docsErr, setDocsErr] = useState<string | null>(null);

  useEffect(() => {
    const v = (globalThis.localStorage?.getItem("cw.sidebarSide") ?? "left") as
      | "left"
      | "right";
    if (v === "right" || v === "left") setSide(v);
  }, []);

  function toggleSide() {
    const next = side === "left" ? "right" : "left";
    setSide(next);
    globalThis.localStorage?.setItem("cw.sidebarSide", next);
  }

  async function pickTag(key: string) {
    const next = activeTag === key ? null : key;
    setActiveTag(next);
    setDocs(null);
    setDocsErr(null);

    if (!next) return;

    setLoadingDocs(true);
    try {
      const res = await fetch(`/api/articles?tag=${encodeURIComponent(next)}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed");
      const items: unknown[] = Array.isArray(data.items) ? (data.items as unknown[]) : [];
      const shaped: DocItem[] = items
        .map((it) => {
          const o = (it ?? {}) as Record<string, unknown>;
          return {
            slug: String(o.slug ?? "").trim(),
            title: String(o.title ?? "").trim(),
          };
        })
        .filter((it) => it.slug && it.title);
      setDocs(shaped);
    } catch (e) {
      setDocsErr(String(e));
      setDocs([]);
    } finally {
      setLoadingDocs(false);
    }
  }

  const sidebar = (
    <aside className="w-full bg-zinc-50/50 p-4 dark:bg-black/30 lg:w-[340px]">
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Navigation
        </div>
        <button type="button" className="text-xs underline text-zinc-500" onClick={toggleSide}>
          {side === "left" ? "move right" : "move left"}
        </button>
      </div>

      <div className="mt-4">
        <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">This page</div>
        {props.toc.length === 0 ? (
          <div className="mt-2 text-xs text-zinc-500">No headings.</div>
        ) : (
          <ul className="mt-2 space-y-1 text-sm">
            {props.toc.map((t) => (
              <li
                key={t.id}
                className={t.level === 3 ? "pl-3" : t.level === 4 ? "pl-6" : ""}
              >
                <a className="hover:underline" href={`#${t.id}`}>
                  {t.text}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-6">
        <div className="flex items-baseline justify-between gap-3">
          <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">Tags</div>
          <Link className="text-xs underline text-zinc-500" href="/">
            search
          </Link>
        </div>

        {props.tags.length === 0 ? (
          <div className="mt-2 text-xs text-zinc-500">No approved tags yet.</div>
        ) : (
          <div className="mt-2 space-y-1">
            {props.tags.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => pickTag(t.key)}
                className={
                  "flex w-full items-center justify-between gap-2 rounded-md px-2 py-1 text-left text-sm hover:bg-zinc-100 dark:hover:bg-white/5 " +
                  (activeTag === t.key ? "bg-zinc-100 dark:bg-white/5" : "")
                }
              >
                <span className="truncate">
                  {t.label}
                  <span className="ml-2 text-[10px] text-zinc-500/70">{t.count}</span>
                </span>
                <span className="text-xs text-zinc-500">▸</span>
              </button>
            ))}
          </div>
        )}

        {activeTag ? (
          <div className="mt-4 rounded-2xl border border-black/10 bg-white p-4 text-sm dark:border-white/15 dark:bg-zinc-950">
            <div className="flex items-baseline justify-between gap-3">
              <div className="text-xs font-medium tracking-wide text-zinc-500">DOCUMENTS</div>
              <button
                type="button"
                className="text-xs underline text-zinc-500"
                onClick={() => setActiveTag(null)}
              >
                close
              </button>
            </div>

            {loadingDocs ? (
              <div className="mt-3 text-xs text-zinc-500">Loading…</div>
            ) : docsErr ? (
              <div className="mt-3 text-xs text-red-600">{docsErr}</div>
            ) : docs && docs.length === 0 ? (
              <div className="mt-3 text-xs text-zinc-500">No documents for this tag.</div>
            ) : docs ? (
              <ul className="mt-3 space-y-2">
                {docs.slice(0, 30).map((d) => (
                  <li key={d.slug} className="min-w-0">
                    <Link className="block truncate hover:underline" href={`/wiki/${d.slug}`}>
                      {d.title}
                    </Link>
                    <div className="mt-0.5 text-[11px] text-zinc-500">/{d.slug}</div>
                  </li>
                ))}
                {docs.length > 30 ? (
                  <li className="text-xs text-zinc-500">… {docs.length - 30} more</li>
                ) : null}
              </ul>
            ) : null}
          </div>
        ) : null}
      </div>
    </aside>
  );

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col lg:flex-row">
      {side === "left" ? (
        <div className="border-b border-black/10 dark:border-white/10 lg:border-b-0 lg:border-r">
          {sidebar}
        </div>
      ) : null}
      <div className="min-w-0 flex-1">{props.children}</div>
      {side === "right" ? (
        <div className="border-t border-black/10 dark:border-white/10 lg:border-t-0 lg:border-l">
          {sidebar}
        </div>
      ) : null}
    </div>
  );
}
