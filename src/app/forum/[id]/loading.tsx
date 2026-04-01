export default function ForumPostLoading() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <div className="animate-pulse space-y-4">
        <div className="h-4 w-20 rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-10 w-2/3 rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-4 w-48 rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="mt-8 h-56 rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
        <div className="mt-8 h-48 rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
      </div>
    </main>
  );
}
