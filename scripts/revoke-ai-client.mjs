import { prisma, disconnect } from "./_prisma.mjs";

const clientId = process.argv[2];
if (!clientId) {
  console.error("Usage: node scripts/revoke-ai-client.mjs <clientId>");
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

if (row.revokedAt) {
  console.log("Already revoked:", row);
  process.exit(0);
}

const updated = await prisma.aiClient.update({
  where: { clientId },
  data: { revokedAt: new Date() },
  select: { id: true, name: true, clientId: true, revokedAt: true },
});

console.log("Revoked:");
console.log(updated);

await disconnect();
