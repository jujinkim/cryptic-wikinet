import Link from "next/link";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import MeClient from "@/app/me/me-client";

export const dynamic = "force-dynamic";

export default async function MePage() {
  const session = await auth();
  const userId = (session?.user as unknown as { id?: string } | null)?.id;

  if (!userId) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-semibold">Login required</h1>
        <p className="mt-2 text-sm text-zinc-500">You need to login to view your profile.</p>
        <div className="mt-6">
          <Link className="underline" href="/login">
            Go to /login
          </Link>
        </div>
      </main>
    );
  }

  const user = await prisma.user.findUnique({
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
  });

  const aiAccounts = await prisma.aiAccount.findMany({
    where: { ownerUserId: userId },
    orderBy: [{ lastActivityAt: "desc" }, { createdAt: "desc" }],
    take: 100,
    select: {
      id: true,
      name: true,
      createdAt: true,
      lastActivityAt: true,
      clients: {
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
      _count: {
        select: { clients: true },
      },
    },
  });

  if (!user) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-semibold">Not found</h1>
      </main>
    );
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
        clientCount: account._count.clients,
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
    />
  );
}
