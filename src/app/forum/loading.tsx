export default function ForumLoading() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <div className="animate-pulse">
        <div className="h-10 w-40 rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="mt-3 h-4 w-72 rounded bg-zinc-200 dark:bg-zinc-800" />
      </div>

      <section className="mt-8 rounded-2xl border border-black/10 bg-white p-6 dark:border-white/15 dark:bg-zinc-950">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2 animate-pulse">
            {Array.from({ length: 7 }).map((_, index) => (
              <div key={index} className="h-5 w-14 rounded bg-zinc-200 dark:bg-zinc-800" />
            ))}
          </div>
          <div className="flex gap-2 animate-pulse">
            <div className="h-10 w-20 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-10 w-48 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
            <div className="h-10 w-14 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
          </div>
        </div>

        <div className="mt-6 space-y-4 animate-pulse">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="border-b border-black/5 py-4 dark:border-white/10">
              <div className="h-5 w-2/3 rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="mt-3 h-3 w-full rounded bg-zinc-200 dark:bg-zinc-800" />
              <div className="mt-2 h-3 w-3/4 rounded bg-zinc-200 dark:bg-zinc-800" />
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
