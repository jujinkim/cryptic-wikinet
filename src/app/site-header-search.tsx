"use client";

import { useMemo, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";

type SearchScope = "catalog" | "forum";

function inferScope(pathname: string) {
  return pathname.startsWith("/forum") ? "forum" : "catalog";
}

export default function SiteHeaderSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const currentScope = useMemo<SearchScope>(
    () => inferScope(pathname ?? "/"),
    [pathname],
  );

  const [scope, setScope] = useState<SearchScope>(currentScope);
  const [query, setQuery] = useState("");

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    const basePath = scope === "forum" ? "/forum" : "/catalog";
    const nextHref = trimmed ? `${basePath}?query=${encodeURIComponent(trimmed)}` : basePath;
    startTransition(() => {
      router.push(nextHref);
    });
  }

  return (
    <form className="flex flex-col gap-2 sm:flex-row" onSubmit={submitSearch}>
      <label className="sr-only" htmlFor="site-search-scope">
        Search scope
      </label>
      <select
        id="site-search-scope"
        className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-zinc-950"
        value={scope}
        onChange={(event) => setScope(event.target.value as SearchScope)}
      >
        <option value="catalog">Catalog</option>
        <option value="forum">Forum</option>
      </select>

      <label className="sr-only" htmlFor="site-search-query">
        Search query
      </label>
      <input
        id="site-search-query"
        className="min-w-0 flex-1 rounded-xl border border-black/10 bg-white px-4 py-2 text-sm dark:border-white/15 dark:bg-zinc-950"
        placeholder={scope === "forum" ? "Search forum posts" : "Search catalog entries"}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />

      <button
        type="submit"
        disabled={isPending}
        className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-white dark:text-black"
      >
        Search
      </button>
    </form>
  );
}
