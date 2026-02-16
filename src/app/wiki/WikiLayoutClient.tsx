"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import type { TocItem } from "@/lib/markdownToc";

type TreeItem = {
  slug: string;
  title: string;
};

type TreeGroup = {
  type: string;
  items: TreeItem[];
};

export default function WikiLayoutClient(props: {
  slug: string | null;
  toc: TocItem[];
  tree: TreeGroup[];
  children: React.ReactNode;
}) {
  const [side, setSide] = useState<"left" | "right">("left");
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const v = (globalThis.localStorage?.getItem("cw.sidebarSide") ?? "left") as
      | "left"
      | "right";
    if (v === "right" || v === "left") setSide(v);

    const raw = globalThis.localStorage?.getItem("cw.sidebarOpenGroups");
    if (raw) {
      try {
        const j = JSON.parse(raw) as Record<string, boolean>;
        if (j && typeof j === "object") setOpenGroups(j);
      } catch {
        // ignore
      }
    }
  }, []);

  function toggleSide() {
    const next = side === "left" ? "right" : "left";
    setSide(next);
    globalThis.localStorage?.setItem("cw.sidebarSide", next);
  }

  const treeGroups = useMemo(() => {
    // default: open first 2 groups
    const g = props.tree;
    const defaults: Record<string, boolean> = {};
    for (let i = 0; i < Math.min(2, g.length); i++) defaults[g[i]!.type] = true;
    return { g, defaults };
  }, [props.tree]);

  function isOpen(type: string) {
    if (type in openGroups) return !!openGroups[type];
    return !!treeGroups.defaults[type];
  }

  function toggleGroup(type: string) {
    const next = { ...openGroups, [type]: !isOpen(type) };
    setOpenGroups(next);
    globalThis.localStorage?.setItem("cw.sidebarOpenGroups", JSON.stringify(next));
  }

  const sidebar = (
    <aside className="w-full bg-zinc-50/50 p-4 dark:bg-black/30 lg:w-[320px]">
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Navigation
        </div>
        <button
          type="button"
          className="text-xs underline text-zinc-500"
          onClick={toggleSide}
        >
          {side === "left" ? "move right" : "move left"}
        </button>
      </div>

      <div className="mt-4">
        <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          This page
        </div>
        {props.toc.length === 0 ? (
          <div className="mt-2 text-xs text-zinc-500">No headings.</div>
        ) : (
          <ul className="mt-2 space-y-1 text-sm">
            {props.toc.map((t) => (
              <li key={t.id} className={t.level === 3 ? "pl-3" : t.level === 4 ? "pl-6" : ""}>
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
          <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Catalog
          </div>
          <Link className="text-xs underline text-zinc-500" href="/">
            search
          </Link>
        </div>

        <div className="mt-2 space-y-2">
          {treeGroups.g.map((group) => (
            <div key={group.type} className="rounded-xl border border-black/10 bg-white p-3 dark:border-white/15 dark:bg-zinc-950">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 text-left"
                onClick={() => toggleGroup(group.type)}
              >
                <div className="text-sm font-medium">
                  {group.type} <span className="text-xs text-zinc-500">({group.items.length})</span>
                </div>
                <div className="text-xs text-zinc-500">{isOpen(group.type) ? "−" : "+"}</div>
              </button>

              {isOpen(group.type) ? (
                <ul className="mt-2 space-y-1 text-sm">
                  {group.items.slice(0, 60).map((it) => (
                    <li key={it.slug}>
                      <Link
                        className={
                          "block truncate hover:underline " +
                          (props.slug === it.slug ? "font-medium" : "")
                        }
                        href={`/wiki/${it.slug}`}
                      >
                        {it.title}
                      </Link>
                    </li>
                  ))}
                  {group.items.length > 60 ? (
                    <li className="pt-1 text-xs text-zinc-500">… {group.items.length - 60} more</li>
                  ) : null}
                </ul>
              ) : null}
            </div>
          ))}
        </div>
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
