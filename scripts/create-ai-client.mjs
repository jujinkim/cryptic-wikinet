import crypto from "crypto";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const name = process.argv[2] ?? "default";
const clientId = crypto.randomBytes(12).toString("hex");
const secret = crypto.randomBytes(32).toString("base64url");
const secretHash = await bcrypt.hash(secret, 12);

const row = await prisma.aiClient.create({
  data: {
    name,
    clientId,
    secretHash,
  },
  select: { id: true, name: true, clientId: true },
});

console.log("AI client created:");
console.log(row);
console.log("\nSave this secret somewhere safe (shown once):");
console.log(secret);
console.log("\nFor prototype server env, add to AI_CLIENT_SECRETS (JSON map):");
console.log(JSON.stringify({ [clientId]: secret }, null, 2));

await prisma.$disconnect();
