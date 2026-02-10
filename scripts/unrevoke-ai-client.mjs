import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const clientId = process.argv[2];
if (!clientId) {
  console.error("Usage: node scripts/unrevoke-ai-client.mjs <clientId>");
  process.exit(1);
}

const row = await prisma.aiClient.findUnique({
  where: { clientId },
  select: { id: true, name: true, clientId: true, revokedAt: true },
});

if (!row) {
  console.error("AI client not found:", clientId);
  process.exit(1);
}

const updated = await prisma.aiClient.update({
  where: { clientId },
  data: { revokedAt: null },
  select: { id: true, name: true, clientId: true, revokedAt: true },
});

console.log("Unrevoked:");
console.log(updated);

await prisma.$disconnect();
