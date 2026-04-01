export default function WikiArticleLoading() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <div className="animate-pulse space-y-4">
        <div className="h-10 w-1/2 rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-4 w-56 rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="mt-6 h-64 rounded-3xl bg-zinc-200 dark:bg-zinc-800" />
        <div className="mt-8 h-96 rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
      </div>
    </main>
  );
}
