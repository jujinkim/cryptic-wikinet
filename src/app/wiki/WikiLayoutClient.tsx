"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type { TocItem } from "@/lib/markdownToc";

type TagNode = {
  key: string;
  label: string;
  directCount: number;
  totalCount: number;
  children?: TagNode[];
};

type DocItem = {
  slug: string;
  title: string;
  updatedAt: string;
  isCanon: boolean;
  tags?: string[];
  type?: string | null;
  status?: string | null;
};

function TagRow(props: {
  node: TagNode;
  depth: number;
  activeKey: string | null;
  onPick: (key: string) => void;
}) {
  const n = props.node;
  const isOther = n.key === "__other__";
  const pad = props.depth === 0 ? "" : props.depth === 1 ? "pl-3" : "pl-6";
  const countLabel = isOther
    ? `(${n.totalCount} total)`
    : `(${n.totalCount} total · ${n.directCount} direct)`;

  return (
    <div className={pad}>
      <button
        type="button"
        className={
          "flex w-full items-center justify-between gap-2 rounded-md px-2 py-1 text-left text-sm hover:bg-zinc-100 dark:hover:bg-white/5 " +
          (props.activeKey === n.key ? "bg-zinc-100 dark:bg-white/5" : "")
        }
        onClick={() => props.onPick(n.key)}
      >
        <span className="truncate">
          {n.label}
          <span className="ml-2 text-xs text-zinc-500">{countLabel}</span>
        </span>
        <span className="text-xs text-zinc-500">▸</span>
      </button>
    </div>
  );
}

function collectVisible(nodes: TagNode[], depth = 0): Array<{ node: TagNode; depth: number }> {
  const out: Array<{ node: TagNode; depth: number }> = [];
  for (const n of nodes) {
    out.push({ node: n, depth });
    if (n.children?.length) {
      for (const c of n.children) out.push({ node: c, depth: depth + 1 });
    }
  }
  return out;
}

export default function WikiLayoutClient(props: {
  slug: string | null;
  toc: TocItem[];
  tree: TagNode[];
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

  function collectSubtreeKeys(nodes: TagNode[], key: string): string[] {
    function find(n: TagNode): TagNode | null {
      if (n.key === key) return n;
      for (const c of n.children ?? []) {
        const got = find(c);
        if (got) return got;
      }
      return null;
    }

    const root = nodes.map(find).find(Boolean) as TagNode | null;
    if (!root) return [key];

    const out: string[] = [];
    function walk(n: TagNode) {
      out.push(n.key);
      for (const c of n.children ?? []) walk(c);
    }
    walk(root);
    return out.filter((k) => k !== "__other__");
  }

  async function pickTag(key: string) {
    // clicking the same tag closes the popup
    const next = activeTag === key ? null : key;
    setActiveTag(next);
    setDocs(null);
    setDocsErr(null);

    if (!next || next === "__other__") return;

    const keys = collectSubtreeKeys(props.tree, next);

    setLoadingDocs(true);
    try {
      const qs = keys.length > 1 ? `tags=${encodeURIComponent(keys.join(","))}` : `tag=${encodeURIComponent(next)}`;
      const res = await fetch(`/api/articles?${qs}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setDocs(Array.isArray(data.items) ? (data.items as DocItem[]) : []);
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

        <div className="mt-2 space-y-1">
          {collectVisible(props.tree).map(({ node, depth }) => (
            <TagRow
              key={node.key}
              node={node}
              depth={depth}
              activeKey={activeTag}
              onPick={pickTag}
            />
          ))}
        </div>

        {activeTag && activeTag !== "__other__" ? (
          <div className="mt-4 rounded-2xl border border-black/10 bg-white p-4 text-sm dark:border-white/15 dark:bg-zinc-950">
            <div className="flex items-baseline justify-between gap-3">
              <div className="text-xs font-medium tracking-wide text-zinc-500">DOCUMENTS</div>
              <button
                type="button"
                className="text-xs underline text-zinc-500"
                onClick={() => pickTag(activeTag)}
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
