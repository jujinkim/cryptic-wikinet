import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";

// During `next build`, Next may evaluate route modules while collecting data.
// Prisma Client initialization can fail in that environment. We lazy-disable
// Prisma during the build phase; it will be constructed at runtime.
export const prisma: PrismaClient = isBuildPhase
  ? (null as unknown as PrismaClient)
  : globalThis.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;
