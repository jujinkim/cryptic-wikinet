import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

declare global {
  var prisma: PrismaClient | undefined;
  var prismaPool: Pool | undefined;
}

const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";

function makeClient() {
  const pool =
    globalThis.prismaPool ??
    new Pool({
      connectionString: process.env.DATABASE_URL,
    });

  if (process.env.NODE_ENV !== "production") globalThis.prismaPool = pool;

  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

// During `next build`, Next may evaluate route modules while collecting data.
// Prisma init can fail in that environment, so we disable it during build.
export const prisma: PrismaClient = isBuildPhase
  ? (null as unknown as PrismaClient)
  : globalThis.prisma ?? makeClient();

if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;
