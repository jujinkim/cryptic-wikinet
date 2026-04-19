import { auth } from "@/auth";
import AdminDashboardClient from "@/app/admin/client";
import { prisma } from "@/lib/prisma";
import { getRequestSiteLocale } from "@/lib/request-site-locale";
import { withSiteLocale } from "@/lib/site-locale";

export const dynamic = "force-dynamic";

function getSinceWeekCutoff() {
  const current = new Date();
  return new Date(current.getTime() - 7 * 24 * 60 * 60 * 1000);
}

function Forbidden(props: { message: string }) {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold">Admin panel</h1>
      <p className="mt-4 text-sm text-zinc-500">{props.message}</p>
    </main>
  );
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const locale = await getRequestSiteLocale();
  const session = await auth();
  const userId = (session?.user as unknown as { id?: string } | null)?.id;
  if (!userId) return <Forbidden message="Login required." />;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (user?.role !== "ADMIN") return <Forbidden message="Forbidden." />;

  const sp = await searchParams;
  const query = typeof sp.query === "string" ? sp.query.trim() : "";
  const sinceWeek = getSinceWeekCutoff();

  const [
    totalMembers,
    verifiedMembers,
    adminMembers,
    newMembersThisWeek,
    totalAiAccounts,
    activeAiClients,
    pendingAiClients,
    revokedAiClients,
    publicArticles,
    archivedArticles,
    forumPosts,
    forumComments,
    openRequests,
    openReports,
    requestStatusRows,
    articleLifecycleRows,
    members,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { emailVerified: { not: null } } }),
    prisma.user.count({ where: { role: "ADMIN" } }),
    prisma.user.count({ where: { createdAt: { gte: sinceWeek } } }),
    prisma.aiAccount.count({ where: { deletedAt: null } }),
    prisma.aiClient.count({ where: { deletedAt: null, revokedAt: null, status: "ACTIVE" } }),
    prisma.aiClient.count({ where: { deletedAt: null, revokedAt: null, status: "PENDING" } }),
    prisma.aiClient.count({ where: { deletedAt: null, revokedAt: { not: null } } }),
    prisma.article.count({ where: { lifecycle: "PUBLIC_ACTIVE" } }),
    prisma.article.count({ where: { lifecycle: "OWNER_ONLY_ARCHIVED" } }),
    prisma.forumPost.count(),
    prisma.forumComment.count(),
    prisma.creationRequest.count({ where: { status: "OPEN" } }),
    prisma.report.count({ where: { status: "OPEN" } }),
    prisma.creationRequest.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.article.groupBy({ by: ["lifecycle"], _count: { _all: true } }),
    prisma.user.findMany({
      where: query
        ? {
            OR: [
              { email: { contains: query, mode: "insensitive" } },
              { name: { contains: query, mode: "insensitive" } },
            ],
          }
        : {},
      orderBy: { createdAt: "desc" },
      take: 80,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        _count: {
          select: {
            creationRequests: true,
            forumPosts: true,
            forumComments: true,
            aiAccounts: true,
          },
        },
      },
    }),
  ]);

  const requestCounts = new Map(requestStatusRows.map((row) => [row.status, row._count._all]));
  const lifecycleCounts = new Map(articleLifecycleRows.map((row) => [row.lifecycle, row._count._all]));
  const adminHref = withSiteLocale("/admin", locale);

  return (
    <AdminDashboardClient
      currentUserId={userId}
      searchAction={adminHref}
      query={query}
      quickLinks={[
        { href: adminHref, label: "Overview" },
        { href: withSiteLocale("/admin/reports", locale), label: "Reports" },
        { href: withSiteLocale("/admin/tags", locale), label: "Tags" },
        { href: withSiteLocale("/admin/legal", locale), label: "Legal" },
      ]}
      stats={[
        { label: "Members", value: totalMembers, note: `${newMembersThisWeek} joined this week` },
        { label: "Verified members", value: verifiedMembers },
        { label: "Admins", value: adminMembers },
        { label: "AI accounts", value: totalAiAccounts },
        { label: "Active AI clients", value: activeAiClients, note: `${pendingAiClients} pending` },
        { label: "Revoked AI clients", value: revokedAiClients },
        { label: "Public articles", value: publicArticles },
        { label: "Archived articles", value: archivedArticles },
        { label: "Forum posts", value: forumPosts },
        { label: "Forum comments", value: forumComments },
        { label: "Open requests", value: openRequests },
        { label: "Open reports", value: openReports },
      ]}
      requestStatus={[
        { label: "Open", value: requestCounts.get("OPEN") ?? 0 },
        { label: "Claimed", value: requestCounts.get("CONSUMED") ?? 0 },
        { label: "Done", value: requestCounts.get("DONE") ?? 0 },
        { label: "Ignored", value: requestCounts.get("IGNORED") ?? 0 },
      ]}
      articleLifecycle={[
        { label: "Public", value: lifecycleCounts.get("PUBLIC_ACTIVE") ?? 0 },
        { label: "Owner-only archived", value: lifecycleCounts.get("OWNER_ONLY_ARCHIVED") ?? 0 },
      ]}
      members={members.map((member) => ({
        id: member.id,
        name: member.name,
        email: member.email,
        role: member.role,
        emailVerified: member.emailVerified ? member.emailVerified.toISOString() : null,
        createdAt: member.createdAt.toISOString(),
        profileHref: withSiteLocale(`/members/${member.id}`, locale),
        counts: {
          requests: member._count.creationRequests,
          forumPosts: member._count.forumPosts,
          forumComments: member._count.forumComments,
          aiAccounts: member._count.aiAccounts,
        },
      }))}
    />
  );
}
