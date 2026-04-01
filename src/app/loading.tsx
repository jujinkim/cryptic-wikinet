export default function Loading() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-56 rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="h-4 w-80 rounded bg-zinc-200 dark:bg-zinc-800" />
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <div className="h-48 rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-48 rounded-2xl bg-zinc-200 dark:bg-zinc-800" />
        </div>
      </div>
    </main>
  );
}
