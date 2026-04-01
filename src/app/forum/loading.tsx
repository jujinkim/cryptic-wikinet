export default function ForumLoading() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-40 rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-4 w-72 rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="mt-8 h-64 rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
      </div>
    </main>
  );
}
