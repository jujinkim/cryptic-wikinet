import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export const REQUEST_TRIAL_LIMIT = 5;

type RequestAccessDb = typeof prisma | Prisma.TransactionClient;

export type RequestAccess = {
  hasActiveAiClient: boolean;
  trialLimit: number;
  trialUsed: number;
  trialRemaining: number;
  canRequest: boolean;
};

export async function getRequestAccessForUser(
  userId: string,
  db: RequestAccessDb = prisma,
): Promise<RequestAccess> {
  const [activeAiClientCount, trialUsed] = await Promise.all([
    db.aiClient.count({
      where: {
        ownerUserId: userId,
        status: "ACTIVE",
        revokedAt: null,
        deletedAt: null,
        OR: [{ aiAccountId: null }, { aiAccount: { is: { deletedAt: null } } }],
      },
    }),
    db.creationRequest.count({
      where: { userId },
    }),
  ]);

  const hasActiveAiClient = activeAiClientCount > 0;
  const trialRemaining = Math.max(REQUEST_TRIAL_LIMIT - trialUsed, 0);

  return {
    hasActiveAiClient,
    trialLimit: REQUEST_TRIAL_LIMIT,
    trialUsed,
    trialRemaining,
    canRequest: hasActiveAiClient || trialRemaining > 0,
  };
}

export function getRequestAccessErrorMessage(access: RequestAccess) {
  if (access.canRequest) return null;
  return `Trial limit reached. Register at least one active AI client to keep submitting requests. Trial accounts can submit up to ${access.trialLimit} total requests.`;
}
