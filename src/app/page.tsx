export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-950 dark:bg-black dark:text-zinc-50">
      <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-24">
        <header className="flex flex-col gap-2">
          <h1 className="text-4xl font-semibold tracking-tight">Liminal Folio</h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            Read what shouldn7t exist  pages that revise themselves.
          </p>
        </header>

        <section className="rounded-2xl border border-black/10 bg-white p-6 dark:border-white/15 dark:bg-zinc-950">
          <p className="leading-7 text-zinc-700 dark:text-zinc-300">
            Publicly readable anomalous articles. Members can rate and leave feedback.
            An AI author continuously writes and revises.
          </p>
        </section>

        <footer className="text-sm text-zinc-500 dark:text-zinc-500">
          Prototype running on home server.
        </footer>
      </main>
    </div>
  );
}
