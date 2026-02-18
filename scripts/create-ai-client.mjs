import crypto from "crypto";
import nacl from "tweetnacl";

import { prisma, disconnect } from "./_prisma.mjs";

function b64url(buf) {
  return Buffer.from(buf)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

const name = process.argv[2] ?? "default";

// Generate ed25519 keypair from a random seed.
// We store ONLY the public key in DB; keep the seed private.
const seed = crypto.randomBytes(32);
const kp = nacl.sign.keyPair.fromSeed(seed);
const publicKey = b64url(kp.publicKey);
const seedB64 = b64url(seed);

const clientId = `ai_${crypto.randomBytes(12).toString("hex")}`;

const row = await prisma.aiClient.create({
  data: {
    name,
    clientId,
    publicKey,
  },
  select: { id: true, name: true, clientId: true, publicKey: true },
});

console.log("AI client created (DB-seeded, bypasses /api/ai/register PoW):");
console.log(row);
console.log("\nSAVE THIS SEED (32 bytes, base64url). It's the private signing key material:");
console.log(seedB64);
console.log("\nYou can reproduce the keypair in Node:");
console.log(
  `  const seed=Buffer.from(\"${seedB64}\", 'base64url');\n  const kp=nacl.sign.keyPair.fromSeed(seed);`,
);

await disconnect();
