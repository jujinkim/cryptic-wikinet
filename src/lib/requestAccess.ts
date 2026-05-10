import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getCapabilityStateForUser } from "@/lib/userCapabilities";

type RequestAccessDb = typeof prisma | Prisma.TransactionClient;

export type RequestAccess = {
  hasRequestAccess: boolean;
  canRequest: boolean;
};

export async function getRequestAccessForUser(
  userId: string,
  db: RequestAccessDb = prisma,
): Promise<RequestAccess> {
  const capabilities = await getCapabilityStateForUser(userId, db);
  const hasRequestAccess = capabilities.REQUEST_CREATE;

  return {
    hasRequestAccess,
    canRequest: hasRequestAccess,
  };
}

export function getRequestAccessErrorMessage(access: RequestAccess) {
  if (access.canRequest) return null;
  return "Request access required. Paid or manually approved accounts can submit entry requests.";
}
