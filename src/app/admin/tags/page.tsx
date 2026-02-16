import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import TagsAdminClient from "@/app/admin/tags/client";

export const dynamic = "force-dynamic";

export default async function AdminTagsPage() {
  const session = await auth();
  const userId = (session?.user as unknown as { id?: string } | null)?.id;
  if (!userId) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-semibold">Forbidden</h1>
      </main>
    );
  }

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (user?.role !== "ADMIN") {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-semibold">Forbidden</h1>
      </main>
    );
  }

  const approved = await prisma.tag.findMany({
    orderBy: { label: "asc" },
    take: 400,
    select: { key: true, label: true },
  });

  const articles = await prisma.article.findMany({
    take: 2000,
    select: { tags: true },
  });

  const counts = new Map<string, number>();
  const approvedKeys = new Set(approved.map((t) => t.key));
  for (const a of articles) {
    const uniq = new Set(a.tags ?? []);
    for (const t of uniq) {
      if (!approvedKeys.has(t)) continue;
      counts.set(t, (counts.get(t) ?? 0) + 1);
    }
  }

  const approvedWithCounts = approved.map((t) => ({
    key: t.key,
    label: t.label,
    count: counts.get(t.key) ?? 0,
  }));

  const unapproved = await prisma.unapprovedTagStat.findMany({
    orderBy: [{ count: "desc" }, { lastSeenAt: "desc" }],
    take: 50,
    select: { key: true, count: true, lastSeenAt: true },
  });

  return (
    <TagsAdminClient
      approved={approvedWithCounts}
      unapproved={unapproved.map((u) => ({
        key: u.key,
        count: u.count,
        lastSeenAt: u.lastSeenAt.toISOString(),
      }))}
    />
  );
}
