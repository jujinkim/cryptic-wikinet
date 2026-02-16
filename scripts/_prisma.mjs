import "dotenv/config";

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. Copy .env.example -> .env and set DATABASE_URL.");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const prisma = new PrismaClient({
  adapter: new PrismaPg(pool),
});

export async function disconnect() {
  await prisma.$disconnect();
  await pool.end().catch(() => null);
}
