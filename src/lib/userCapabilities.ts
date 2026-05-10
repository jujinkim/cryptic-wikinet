import type { Prisma, UserCapabilityKey, UserRole } from "@prisma/client";

import { prisma } from "@/lib/prisma";

type CapabilityDb = typeof prisma | Prisma.TransactionClient;

export const USER_CAPABILITY_KEYS = [
  "REQUEST_CREATE",
  "CATALOG_AI_WRITE",
] as const satisfies readonly UserCapabilityKey[];

export type CapabilityState = Record<UserCapabilityKey, boolean>;

export function emptyCapabilityState(): CapabilityState {
  return {
    REQUEST_CREATE: false,
    CATALOG_AI_WRITE: false,
  };
}

export function roleHasImplicitCapability(role: UserRole | null | undefined) {
  return role === "ADMIN";
}

export async function getCapabilityStateForUser(
  userId: string,
  db: CapabilityDb = prisma,
): Promise<CapabilityState & { role: UserRole | null }> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      capabilities: {
        where: {
          revokedAt: null,
        },
        select: { key: true },
      },
    },
  });

  const state = emptyCapabilityState();
  const role = user?.role ?? null;
  if (roleHasImplicitCapability(role)) {
    for (const key of USER_CAPABILITY_KEYS) state[key] = true;
  }
  for (const capability of user?.capabilities ?? []) {
    state[capability.key] = true;
  }

  return { ...state, role };
}

export async function userHasCapability(
  userId: string,
  key: UserCapabilityKey,
  db: CapabilityDb = prisma,
) {
  const state = await getCapabilityStateForUser(userId, db);
  return state[key];
}

export async function setUserCapability(args: {
  userId: string;
  key: UserCapabilityKey;
  enabled: boolean;
  actorUserId: string;
}) {
  const now = new Date();
  if (args.enabled) {
    return prisma.userCapability.upsert({
      where: {
        userId_key: {
          userId: args.userId,
          key: args.key,
        },
      },
      update: {
        revokedAt: null,
        revokedByUserId: null,
        grantedAt: now,
        grantedByUserId: args.actorUserId,
      },
      create: {
        userId: args.userId,
        key: args.key,
        grantedAt: now,
        grantedByUserId: args.actorUserId,
      },
      select: {
        userId: true,
        key: true,
        revokedAt: true,
      },
    });
  }

  return prisma.userCapability.upsert({
    where: {
      userId_key: {
        userId: args.userId,
        key: args.key,
      },
    },
    update: {
      revokedAt: now,
      revokedByUserId: args.actorUserId,
    },
    create: {
      userId: args.userId,
      key: args.key,
      grantedAt: now,
      grantedByUserId: args.actorUserId,
      revokedAt: now,
      revokedByUserId: args.actorUserId,
    },
    select: {
      userId: true,
      key: true,
      revokedAt: true,
    },
  });
}

export async function aiClientOwnerHasCapability(args: {
  aiClientDbId: string;
  key: UserCapabilityKey;
  db?: CapabilityDb;
}) {
  const db = args.db ?? prisma;
  const client = await db.aiClient.findUnique({
    where: { id: args.aiClientDbId },
    select: {
      ownerUserId: true,
      aiAccount: {
        select: {
          ownerUserId: true,
        },
      },
    },
  });

  const ownerUserId = client?.aiAccount?.ownerUserId ?? client?.ownerUserId ?? null;
  if (!ownerUserId) return false;

  return userHasCapability(ownerUserId, args.key, db);
}

export async function requireAiClientOwnerCapability(args: {
  aiClientDbId: string;
  key: UserCapabilityKey;
}) {
  const ok = await aiClientOwnerHasCapability(args);
  if (ok) return null;

  const code =
    args.key === "CATALOG_AI_WRITE"
      ? "catalog_ai_write_required"
      : "request_access_required";
  return Response.json({ error: code }, { status: 403 });
}
