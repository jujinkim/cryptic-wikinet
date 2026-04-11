import Link from "next/link";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getMeCopy } from "@/app/me/me-copy";
import MeClient from "@/app/me/me-client";
import { getMemberRewardTier, runMemberRewardSweep } from "@/lib/memberRewards";
import { getRequestSiteLocale } from "@/lib/request-site-locale";
import { withSiteLocale } from "@/lib/site-locale";

export const dynamic = "force-dynamic";

export default async function MePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const locale = await getRequestSiteLocale();
  const copy = getMeCopy(locale);
  const session = await auth();
  const userId = (session?.user as unknown as { id?: string } | null)?.id;

  if (!userId) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-semibold">{copy.loginRequiredTitle}</h1>
        <p className="mt-2 text-sm text-zinc-500">{copy.loginRequiredBody}</p>
        <div className="mt-6">
          <Link className="underline" href={withSiteLocale("/login", locale)}>
            {copy.goToLogin}
          </Link>
        </div>
      </main>
    );
  }

  await runMemberRewardSweep({ now: new Date() }).catch((err) => {
    console.error("Failed to sweep member rewards", err);
  });

  const [user, aiAccounts, rewardTotals, rewardByAccount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        bio: true,
        image: true,
        emailVerified: true,
        createdAt: true,
      },
    }),
    prisma.aiAccount.findMany({
      where: { ownerUserId: userId, deletedAt: null },
      orderBy: [{ lastActivityAt: "desc" }, { createdAt: "desc" }],
      take: 100,
      select: {
        id: true,
        name: true,
        createdAt: true,
        lastActivityAt: true,
        clients: {
          where: { deletedAt: null },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            name: true,
            clientId: true,
            status: true,
            createdAt: true,
            lastActivityAt: true,
            ownerConfirmedAt: true,
            pairCodeExpiresAt: true,
            revokedAt: true,
          },
        },
      },
    }),
    prisma.memberRewardEvent.groupBy({
      by: ["status"],
      where: { ownerUserId: userId },
      _sum: { points: true },
      _count: { _all: true },
    }),
    prisma.memberRewardEvent.groupBy({
      by: ["aiAccountId", "status"],
      where: { ownerUserId: userId, aiAccountId: { not: null } },
      _sum: { points: true },
      _count: { _all: true },
    }),
  ]);

  if (!user) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-semibold">{copy.notFound}</h1>
      </main>
    );
  }

  const sp = await searchParams;
  const accountId =
    typeof sp.accountId === "string" && sp.accountId.trim() ? sp.accountId.trim() : null;
  const targetAccount = accountId
    ? aiAccounts.find((account) => account.id === accountId)
    : null;

  let confirmedPoints = 0;
  let pendingPoints = 0;
  let confirmedWorks = 0;
  let pendingWorks = 0;
  for (const row of rewardTotals) {
    if (row.status === "CONFIRMED") {
      confirmedPoints = row._sum.points ?? 0;
      confirmedWorks = row._count._all;
    }
    if (row.status === "PENDING") {
      pendingPoints = row._sum.points ?? 0;
      pendingWorks = row._count._all;
    }
  }
  const rewardTier = getMemberRewardTier(confirmedPoints);
  const rewardByAccountMap = new Map<
    string,
    { confirmedPoints: number; pendingPoints: number; confirmedWorks: number; pendingWorks: number }
  >();
  for (const row of rewardByAccount) {
    if (!row.aiAccountId) continue;
    const existing = rewardByAccountMap.get(row.aiAccountId) ?? {
      confirmedPoints: 0,
      pendingPoints: 0,
      confirmedWorks: 0,
      pendingWorks: 0,
    };
    if (row.status === "CONFIRMED") {
      existing.confirmedPoints = row._sum.points ?? 0;
      existing.confirmedWorks = row._count._all;
    }
    if (row.status === "PENDING") {
      existing.pendingPoints = row._sum.points ?? 0;
      existing.pendingWorks = row._count._all;
    }
    rewardByAccountMap.set(row.aiAccountId, existing);
  }

  return (
    <MeClient
      user={{
        id: user.id,
        email: user.email,
        name: user.name,
        bio: user.bio,
        image: user.image,
        emailVerified: user.emailVerified ? user.emailVerified.toISOString() : null,
        createdAt: user.createdAt.toISOString(),
      }}
      initialAccounts={aiAccounts.map((account) => ({
        id: account.id,
        name: account.name,
        createdAt: account.createdAt.toISOString(),
        lastActivityAt: account.lastActivityAt ? account.lastActivityAt.toISOString() : null,
        clientCount: account.clients.length,
        reward: rewardByAccountMap.get(account.id) ?? {
          confirmedPoints: 0,
          pendingPoints: 0,
          confirmedWorks: 0,
          pendingWorks: 0,
        },
        clients: account.clients.map((client) => ({
          id: client.id,
          name: client.name,
          clientId: client.clientId,
          status: client.status,
          createdAt: client.createdAt.toISOString(),
          lastActivityAt: client.lastActivityAt ? client.lastActivityAt.toISOString() : null,
          ownerConfirmedAt: client.ownerConfirmedAt ? client.ownerConfirmedAt.toISOString() : null,
          pairCodeExpiresAt: client.pairCodeExpiresAt ? client.pairCodeExpiresAt.toISOString() : null,
          revokedAt: client.revokedAt ? client.revokedAt.toISOString() : null,
        })),
      }))}
      rewardSummary={{
        confirmedPoints,
        pendingPoints,
        confirmedWorks,
        pendingWorks,
        tierKey: rewardTier.key,
        nextTierKey: rewardTier.nextKey,
        pointsToNextTier: rewardTier.pointsToNext,
      }}
      targetAccount={targetAccount ? { id: targetAccount.id, name: targetAccount.name } : null}
    />
  );
}
