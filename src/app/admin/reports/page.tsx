import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function getReports(status: "OPEN" | "RESOLVED") {
  const res = await fetch(
    `${process.env.NEXTAUTH_URL}/api/reports/admin?status=${status}`,
    { cache: "no-store" },
  );
  if (!res.ok) return null;
  return (await res.json()) as {
    items: Array<{
      id: string;
      targetType: string;
      targetRef: string;
      reason: string | null;
      status: string;
      createdAt: string;
      resolvedAt: string | null;
      reporter: { id: string; email: string; name: string | null };
      resolvedBy: { id: string; email: string; name: string | null } | null;
    }>;
  };
}

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  const userId = (session?.user as unknown as { id?: string } | null)?.id;
  if (!userId) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-16">
        <h1 className="text-3xl font-semibold">Reports</h1>
        <p className="mt-4 text-sm text-zinc-500">Login required.</p>
      </main>
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (user?.role !== "ADMIN") {
    return (
      <main className="mx-auto max-w-4xl px-6 py-16">
        <h1 className="text-3xl font-semibold">Reports</h1>
        <p className="mt-4 text-sm text-zinc-500">Forbidden.</p>
      </main>
    );
  }

  const sp = await searchParams;
  const status = String(sp.status ?? "OPEN").toUpperCase() === "RESOLVED" ? "RESOLVED" : "OPEN";
  const data = await getReports(status);

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Reports</h1>
          <p className="mt-2 text-sm text-zinc-500">Admin-only moderation queue.</p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Link
            className={status === "OPEN" ? "font-medium underline" : "underline"}
            href={{ pathname: "/admin/reports", query: { status: "OPEN" } }}
          >
            Open
          </Link>
          <Link
            className={status === "RESOLVED" ? "font-medium underline" : "underline"}
            href={{ pathname: "/admin/reports", query: { status: "RESOLVED" } }}
          >
            Resolved
          </Link>
        </div>
      </header>

      {!data ? (
        <div className="mt-8 text-sm text-zinc-500">Failed to load.</div>
      ) : data.items.length === 0 ? (
        <div className="mt-8 text-sm text-zinc-500">No reports.</div>
      ) : (
        <ul className="mt-8 space-y-3">
          {data.items.map((r) => (
            <li key={r.id} className="rounded-xl border border-black/10 p-4 dark:border-white/15">
              <div className="text-xs text-zinc-500">
                {new Date(r.createdAt).toLocaleString()} · {r.status}
              </div>
              <div className="mt-1 text-sm font-medium">
                {r.targetType} · {r.targetRef}
              </div>
              {r.reason ? <div className="mt-2 text-sm">{r.reason}</div> : null}
              <div className="mt-2 text-xs text-zinc-500">
                by {r.reporter.name ?? r.reporter.email}
                {r.resolvedBy ? ` · resolved by ${r.resolvedBy.name ?? r.resolvedBy.email}` : ""}
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
