import ReactMarkdown from "react-markdown";
import { extractCatalogMeta } from "@/lib/catalogMeta";
import RatingPanel from "@/app/wiki/[slug]/rating-panel";

async function getArticle(slug: string) {
  const res = await fetch(`${process.env.NEXTAUTH_URL}/api/articles/${slug}`, {
    cache: "no-store",
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.article as {
    slug: string;
    title: string;
    isCanon: boolean;
    tags: string[];
    updatedAt: string;
    currentRevision: { revNumber: number; contentMd: string; createdAt: string } | null;
  };
}

export default async function WikiArticlePage({
  params,
}: {
  params: { slug: string };
}) {
  const article = await getArticle(params.slug);
  if (!article) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-semibold">Not found</h1>
      </main>
    );
  }

  const meta = extractCatalogMeta(article.currentRevision?.contentMd ?? "");

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <header className="mb-8">
        <h1 className="text-4xl font-semibold tracking-tight">{article.title}</h1>
        <div className="mt-2 text-sm text-zinc-500">
          /wiki/{article.slug} · rev {article.currentRevision?.revNumber ?? "?"}
          {article.isCanon ? " · canon" : ""}
        </div>
        {article.tags?.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {article.tags.map((t) => (
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

        <div className="mt-4 text-sm">
          <a className="underline" href={`/wiki/${article.slug}/history`}>
            View history
          </a>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <article className="prose prose-zinc max-w-none dark:prose-invert">
          <ReactMarkdown>{article.currentRevision?.contentMd ?? ""}</ReactMarkdown>
        </article>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl border border-black/10 bg-white p-5 text-sm dark:border-white/15 dark:bg-zinc-950">
              <div className="text-xs font-medium tracking-wide text-zinc-500">CATALOG</div>
              <dl className="mt-3 space-y-2">
                {meta.designation ? (
                  <div className="flex justify-between gap-4">
                    <dt className="text-zinc-500">Designation</dt>
                    <dd className="text-right font-medium">{meta.designation}</dd>
                  </div>
                ) : null}
                {meta.commonName ? (
                  <div className="flex justify-between gap-4">
                    <dt className="text-zinc-500">Common name</dt>
                    <dd className="text-right font-medium">{meta.commonName}</dd>
                  </div>
                ) : null}
                {meta.type ? (
                  <div className="flex justify-between gap-4">
                    <dt className="text-zinc-500">Type</dt>
                    <dd className="text-right font-medium">{meta.type}</dd>
                  </div>
                ) : null}
                {meta.status ? (
                  <div className="flex justify-between gap-4">
                    <dt className="text-zinc-500">Status</dt>
                    <dd className="text-right font-medium">{meta.status}</dd>
                  </div>
                ) : null}
                {meta.lastObserved ? (
                  <div className="flex justify-between gap-4">
                    <dt className="text-zinc-500">Last observed</dt>
                    <dd className="text-right font-medium">{meta.lastObserved}</dd>
                  </div>
                ) : null}
              </dl>

              {!meta.designation && !meta.type && !meta.status ? (
                <p className="mt-3 text-xs text-zinc-500">
                  Tip: include the “Header” bullets from `docs/ARTICLE_TEMPLATE.md` to populate this card.
                </p>
              ) : null}
            </div>

            <RatingPanel slug={article.slug} />
          </div>
        </aside>
      </div>
    </main>
  );
}
