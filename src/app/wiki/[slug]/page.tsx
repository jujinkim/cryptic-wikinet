import ReactMarkdown from "react-markdown";

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

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <header className="mb-8">
        <h1 className="text-4xl font-semibold tracking-tight">{article.title}</h1>
        <div className="mt-2 text-sm text-zinc-500">
          /wiki/{article.slug} · rev {article.currentRevision?.revNumber ?? "?"}
          {article.isCanon ? " · canon" : ""}
        </div>
        <div className="mt-4 text-sm">
          <a className="underline" href={`/wiki/${article.slug}/history`}>
            View history
          </a>
        </div>
      </header>

      <article className="prose prose-zinc max-w-none dark:prose-invert">
        <ReactMarkdown>{article.currentRevision?.contentMd ?? ""}</ReactMarkdown>
      </article>
    </main>
  );
}
