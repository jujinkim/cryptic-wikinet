import Link from "next/link";

async function getCanon() {
  const res = await fetch(`${process.env.NEXTAUTH_URL}/api/articles?canon=1`, {
    cache: "no-store",
  });
  if (!res.ok) return null;
  return (await res.json()) as {
    items: Array<{
      slug: string;
      title: string;
      updatedAt: string;
      tags?: string[];
      type?: string | null;
      status?: string | null;
    }>;
  };
}

export default async function CanonPage() {
  const data = await getCanon();

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <header className="flex flex-col gap-2">
        <h1 className="text-4xl font-semibold tracking-tight">Canon</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Stable reference entries. Canon pages are protected from AI auto-revision.
        </p>
        <div className="text-sm">
          <Link className="underline" href="/">
            ← Back to catalog
          </Link>
        </div>
      </header>

      <section className="mt-8 rounded-2xl border border-black/10 bg-white p-6 dark:border-white/15 dark:bg-zinc-950">
        {!data ? (
          <div className="text-sm text-zinc-500">Failed to load.</div>
        ) : data.items.length === 0 ? (
          <div className="text-sm text-zinc-500">No canon entries yet.</div>
        ) : (
          <ul className="divide-y divide-black/5 dark:divide-white/10">
            {data.items.map((it) => (
              <li key={it.slug} className="py-3">
                <a className="font-medium hover:underline" href={`/wiki/${it.slug}`}>
                  {it.title}
                </a>
                <div className="mt-1 text-xs text-zinc-500">
                  /{it.slug} · {it.type ?? "?"} · {it.status ?? "?"} ·{" "}
                  {new Date(it.updatedAt).toLocaleString()}
                </div>
                {it.tags && it.tags.length ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {it.tags.slice(0, 8).map((t) => (
                      <a
                        key={t}
                        href={`/?tag=${encodeURIComponent(t)}`}
                        className="rounded-full border border-black/10 bg-white px-2 py-0.5 text-[11px] text-zinc-700 hover:bg-zinc-50 dark:border-white/15 dark:bg-black dark:text-zinc-200 dark:hover:bg-zinc-900"
                      >
                        {t}
                      </a>
                    ))}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
