import Link from "next/link";

import { auth } from "@/auth";
import ReportResolveButton from "@/app/admin/reports/client";
import LocalTime from "@/components/local-time";
import { prisma } from "@/lib/prisma";
import { getRequestSiteLocale } from "@/lib/request-site-locale";
import { withSiteLocale } from "@/lib/site-locale";

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
  const locale = await getRequestSiteLocale();
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
  const overviewHref = withSiteLocale("/admin", locale);
  const reportsHref = withSiteLocale("/admin/reports", locale);

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
            href={{ pathname: reportsHref, query: { status: "OPEN" } }}
          >
            Open
          </Link>
          <Link
            className={status === "RESOLVED" ? "font-medium underline" : "underline"}
            href={{ pathname: reportsHref, query: { status: "RESOLVED" } }}
          >
            Resolved
          </Link>
        </div>
      </header>

      <div className="mt-5 flex flex-wrap gap-3 text-sm">
        <Link className="underline" href={overviewHref}>
          Overview
        </Link>
        <Link className="underline" href={withSiteLocale("/admin/tags", locale)}>
          Tags
        </Link>
        <Link className="underline" href={withSiteLocale("/admin/legal", locale)}>
          Legal
        </Link>
      </div>

      {!data ? (
        <div className="mt-8 text-sm text-zinc-500">Failed to load.</div>
      ) : data.items.length === 0 ? (
        <div className="mt-8 text-sm text-zinc-500">No reports.</div>
      ) : (
        <ul className="mt-8 space-y-3">
          {data.items.map((report) => (
            <li key={report.id} className="rounded-xl border border-black/10 p-4 dark:border-white/15">
              <div className="text-xs text-zinc-500">
                <LocalTime value={report.createdAt} /> · {report.status}
              </div>
              <div className="mt-1 text-sm font-medium">
                {report.targetType} · {report.targetRef}
              </div>
              {report.reason ? <div className="mt-2 text-sm">{report.reason}</div> : null}
              <div className="mt-3 flex items-center justify-between gap-4">
                <div className="text-xs text-zinc-500">
                  by {report.reporter.name ?? report.reporter.email}
                  {report.resolvedBy
                    ? ` · resolved by ${report.resolvedBy.name ?? report.resolvedBy.email}`
                    : ""}
                </div>

                <ReportResolveButton
                  reportId={report.id}
                  initialStatus={report.status === "RESOLVED" ? "RESOLVED" : "OPEN"}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
