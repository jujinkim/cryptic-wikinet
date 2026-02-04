async function getRevisions(slug: string) {
  const res = await fetch(
    `${process.env.NEXTAUTH_URL}/api/articles/${slug}/revisions`,
    { cache: "no-store" },
  );
  if (!res.ok) return null;
  return (await res.json()) as {
    revisions: Array<{
      revNumber: number;
      summary: string | null;
      source: string;
      createdAt: string;
    }>;
  };
}

export default async function HistoryPage({ params }: { params: { slug: string } }) {
  const data = await getRevisions(params.slug);
  if (!data) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-semibold">Not found</h1>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold">History</h1>
      <p className="mt-2 text-sm text-zinc-500">/wiki/{params.slug}</p>

      <ul className="mt-8 space-y-3">
        {data.revisions.map((r) => (
          <li
            key={r.revNumber}
            className="rounded-xl border border-black/10 p-4 dark:border-white/15"
          >
            <div className="text-sm text-zinc-500">rev {r.revNumber} · {r.source} · {new Date(r.createdAt).toLocaleString()}</div>
            {r.summary ? (
              <div className="mt-2 text-sm text-zinc-800 dark:text-zinc-200">
                {r.summary}
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </main>
  );
}
