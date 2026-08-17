import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { getConnectionString } from "@netlify/database";
import { Pool } from "pg";

declare global {
  var prisma: PrismaClient | undefined;
  var prismaPool: Pool | undefined;
}

const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";

function normalizeDbConnString(raw: string) {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return raw;
  }

  const host = u.hostname.toLowerCase();
  const isSupabase = host.includes("supabase.co") || host.includes("supabase.com");
  const sslmode = (u.searchParams.get("sslmode") ?? "").toLowerCase();
  const shouldApplyCompat =
    isSupabase && (sslmode === "require" || sslmode === "prefer" || sslmode === "verify-ca");

  if (shouldApplyCompat && !u.searchParams.has("uselibpqcompat")) {
    u.searchParams.set("uselibpqcompat", "true");
  }

  return u.toString();
}

function getDbConnString() {
  // Netlify Database injects NETLIFY_DB_URL. Keep its use behind an explicit
  // provider switch so provisioning a Netlify database cannot switch live
  // traffic away from an existing database by accident.
  const useNetlifyDatabase = process.env.DATABASE_PROVIDER === "netlify";
  const netlifyDatabaseUrl = useNetlifyDatabase ? getConnectionString() : undefined;
  const s =
    netlifyDatabaseUrl ||
    process.env.DATABASE_POOL_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL_NON_POOLING;
  if (!s) {
    throw new Error(
      "Set NETLIFY_DB_URL with DATABASE_PROVIDER=netlify, or set DATABASE_POOL_URL/DATABASE_URL.",
    );
  }
  return normalizeDbConnString(s);
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
