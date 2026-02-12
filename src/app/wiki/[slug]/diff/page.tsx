import Link from "next/link";
import { diffLines } from "diff";
import { prisma } from "@/lib/prisma";

type Row = {
  left?: string;
  right?: string;
  kind: "same" | "add" | "del" | "chg";
};

function splitLines(s: string) {
  // keep trailing empty line behavior stable
  return s.replace(/\r\n/g, "\n").split("\n");
}

function buildRows(oldText: string, newText: string): Row[] {
  const parts = diffLines(oldText, newText);
  const rows: Row[] = [];

  for (let i = 0; i < parts.length; i++) {
    const p = parts[i]!;

    // Changed block often appears as: removed then added
    if (p.removed && i + 1 < parts.length && parts[i + 1]!.added) {
      const removedLines = splitLines(p.value);
      const addedLines = splitLines(parts[i + 1]!.value);
      const n = Math.max(removedLines.length, addedLines.length);
      for (let k = 0; k < n; k++) {
        rows.push({
          left: removedLines[k],
          right: addedLines[k],
          kind: "chg",
        });
      }
      i++; // skip next (added)
      continue;
    }

    if (p.added) {
      for (const line of splitLines(p.value)) {
        rows.push({ left: undefined, right: line, kind: "add" });
      }
      continue;
    }

    if (p.removed) {
      for (const line of splitLines(p.value)) {
        rows.push({ left: line, right: undefined, kind: "del" });
      }
      continue;
    }

    for (const line of splitLines(p.value)) {
      rows.push({ left: line, right: line, kind: "same" });
    }
  }

  // drop a single trailing empty row if both sides are empty
  while (
    rows.length &&
    rows[rows.length - 1]!.left === "" &&
    rows[rows.length - 1]!.right === "" &&
    rows[rows.length - 1]!.kind === "same"
  ) {
    rows.pop();
  }

  return rows;
}

function cls(kind: Row["kind"], side: "left" | "right") {
  if (kind === "add") return side === "right" ? "bg-green-50 dark:bg-green-950/30" : "bg-zinc-50 dark:bg-black";
  if (kind === "del") return side === "left" ? "bg-red-50 dark:bg-red-950/30" : "bg-zinc-50 dark:bg-black";
  if (kind === "chg") return side === "left" ? "bg-red-50 dark:bg-red-950/30" : "bg-green-50 dark:bg-green-950/30";
  return "bg-white dark:bg-zinc-950";
}

export default async function DiffPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const from = Number(Array.isArray(sp.from) ? sp.from[0] : sp.from);
  const to = Number(Array.isArray(sp.to) ? sp.to[0] : sp.to);

  if (!Number.isFinite(from) || !Number.isFinite(to) || from <= 0 || to <= 0) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-semibold">Diff</h1>
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
          Missing parameters. Use <code>?from=N&amp;to=M</code>.
        </p>
      </main>
    );
  }

  const article = await prisma.article.findUnique({
    where: { slug },
    select: { id: true, title: true },
  });
  if (!article) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-semibold">Not found</h1>
      </main>
    );
  }

  const [a, b, revs] = await Promise.all([
    prisma.articleRevision.findUnique({
      where: { articleId_revNumber: { articleId: article.id, revNumber: from } },
      select: { contentMd: true, createdAt: true, summary: true, source: true },
    }),
    prisma.articleRevision.findUnique({
      where: { articleId_revNumber: { articleId: article.id, revNumber: to } },
      select: { contentMd: true, createdAt: true, summary: true, source: true },
    }),
    prisma.articleRevision.findMany({
      where: { articleId: article.id },
      orderBy: { revNumber: "desc" },
      select: { revNumber: true },
      take: 100,
    }),
  ]);

  const revList = revs as Array<{ revNumber: number }>;

  if (!a || !b) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-semibold">Diff</h1>
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">Revision not found.</p>
      </main>
    );
  }

  const rows = buildRows(a.contentMd, b.contentMd);

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <header className="flex flex-col gap-2">
        <div className="text-sm">
          <Link className="underline" href={`/wiki/${slug}/history`}>
            ← Back to history
          </Link>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">Diff</h1>
        <div className="text-sm text-zinc-600 dark:text-zinc-400">
          <span className="font-medium">{article.title}</span> · /wiki/{slug}
        </div>

        <form className="mt-2 flex flex-wrap items-center gap-2 text-sm" method="GET">
          <label className="text-xs text-zinc-500" htmlFor="from">from</label>
          <select
            id="from"
            name="from"
            defaultValue={String(from)}
            className="rounded-lg border border-black/10 bg-white px-2 py-1 text-sm dark:border-white/15 dark:bg-black"
          >
            {revList.map((r) => (
              <option key={r.revNumber} value={r.revNumber}>
                {r.revNumber}
              </option>
            ))}
          </select>

          <label className="ml-2 text-xs text-zinc-500" htmlFor="to">to</label>
          <select
            id="to"
            name="to"
            defaultValue={String(to)}
            className="rounded-lg border border-black/10 bg-white px-2 py-1 text-sm dark:border-white/15 dark:bg-black"
          >
            {revList.map((r) => (
              <option key={r.revNumber} value={r.revNumber}>
                {r.revNumber}
              </option>
            ))}
          </select>

          <button className="ml-2 rounded-lg bg-black px-3 py-1 text-sm font-medium text-white dark:bg-white dark:text-black">
            View
          </button>

          <div className="ml-2 text-xs text-zinc-500">
            current: rev {from} ({a.source}) → rev {to} ({b.source})
          </div>
        </form>
      </header>

      <section className="mt-8 overflow-hidden rounded-2xl border border-black/10 bg-white dark:border-white/15 dark:bg-zinc-950">
        <div className="grid grid-cols-2 border-b border-black/10 text-xs font-medium text-zinc-500 dark:border-white/15">
          <div className="px-4 py-2">rev {from}</div>
          <div className="px-4 py-2">rev {to}</div>
        </div>

        <div className="grid grid-cols-2 text-xs">
          {rows.map((r, idx) => (
            <div key={idx} className="contents">
              <pre
                className={
                  "m-0 whitespace-pre-wrap break-words border-r border-black/10 px-4 py-1 font-mono leading-5 dark:border-white/15 " +
                  cls(r.kind, "left")
                }
              >
                {r.left ?? ""}
              </pre>
              <pre
                className={
                  "m-0 whitespace-pre-wrap break-words px-4 py-1 font-mono leading-5 " +
                  cls(r.kind, "right")
                }
              >
                {r.right ?? ""}
              </pre>
            </div>
          ))}
        </div>
      </section>

      <footer className="mt-6 text-xs text-zinc-500">
        Tip: this is a line-based diff. Markdown formatting changes may produce noisy diffs.
      </footer>
    </main>
  );
}
