export function RequestListSkeleton() {
  return (
    <div className="mt-6 space-y-3 animate-pulse">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="rounded-xl border border-black/10 p-4 dark:border-white/15"
        >
          <div className="h-3 w-36 rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="mt-3 h-4 w-full rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="mt-2 h-4 w-3/4 rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="mt-3 h-3 w-28 rounded bg-zinc-200 dark:bg-zinc-800" />
        </div>
      ))}
    </div>
  );
}

export default function RequestPageSkeleton() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <div className="animate-pulse">
        <div className="h-10 w-56 rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="mt-3 h-4 w-80 rounded bg-zinc-200 dark:bg-zinc-800" />
      </div>

      <section className="mt-8 rounded-2xl border border-black/10 bg-white p-6 dark:border-white/15 dark:bg-zinc-950">
        <div className="animate-pulse">
          <div className="h-4 w-24 rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="mt-3 h-32 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
          <div className="mt-4 h-11 rounded-xl bg-zinc-200 dark:bg-zinc-800" />
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-black/10 bg-white p-6 dark:border-white/15 dark:bg-zinc-950">
        <div className="animate-pulse">
          <div className="h-6 w-40 rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="mt-3 h-4 w-72 rounded bg-zinc-200 dark:bg-zinc-800" />
        </div>
        <RequestListSkeleton />
      </section>
    </main>
  );
}
