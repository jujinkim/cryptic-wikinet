import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

declare global {
  var prisma: PrismaClient | undefined;
  var prismaPool: Pool | undefined;
}

const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";

function getDbConnString() {
  // Recommended for Vercel/serverless: use a pooled URL at runtime.
  // For migrations, Prisma uses prisma.config.ts -> DATABASE_URL.
  const s =
    process.env.DATABASE_POOL_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL_NON_POOLING;
  if (!s) {
    throw new Error(
      "DATABASE_POOL_URL or DATABASE_URL must be set (or Supabase POSTGRES_PRISMA_URL/POSTGRES_URL/_NON_POOLING).",
    );
  }
  return s;
}

function makeClient() {
  const pool =
    globalThis.prismaPool ??
    new Pool({
      connectionString: getDbConnString(),
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
