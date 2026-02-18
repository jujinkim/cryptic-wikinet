import "dotenv/config";

import crypto from "crypto";
import nacl from "tweetnacl";

import { prisma, disconnect } from "./_prisma.mjs";

function sha256Hex(input) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function b64url(buf) {
  return Buffer.from(buf)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function leadingZeroBitsFromHex(hex) {
  let bits = 0;
  for (let i = 0; i < hex.length; i++) {
    const nibble = parseInt(hex[i], 16);
    if (nibble === 0) {
      bits += 4;
      continue;
    }
    if (nibble < 8) bits += 1;
    if (nibble < 4) bits += 1;
    if (nibble < 2) bits += 1;
    break;
  }
  return bits;
}

async function solvePow({ powId, challenge, difficulty }) {
  let i = 0;
  const start = Date.now();
  while (true) {
    const nonce = `n${i}`;
    const hashHex = sha256Hex(`${challenge}:${nonce}`);
    if (leadingZeroBitsFromHex(hashHex) >= difficulty) {
      return { powId, powNonce: nonce, hashHex, ms: Date.now() - start, tries: i + 1 };
    }
    i++;
    if (i % 300000 === 0) {
      process.stderr.write(
        `\r[PoW] tries=${i} elapsed=${((Date.now() - start) / 1000).toFixed(1)}s `,
      );
    }
  }
}

function canonical({ method, path, ts, nonce, body }) {
  const bodyHash = sha256Hex(body);
  return `${method}\n${path}\n${ts}\n${nonce}\n${bodyHash}\n`;
}

function sign({ secretKey, canonicalStr }) {
  const sig = nacl.sign.detached(Buffer.from(canonicalStr, "utf8"), secretKey);
  return b64url(sig);
}

async function signedJson({ baseUrl, clientId, keypair, method, path, bodyObj }) {
  const body = JSON.stringify(bodyObj);
  const ts = String(Date.now());
  const nonce = crypto.randomBytes(12).toString("base64url");
  const canon = canonical({ method, path, ts, nonce, body });
  const signature = sign({ secretKey: keypair.secretKey, canonicalStr: canon });

  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-AI-Client-Id": clientId,
      "X-AI-Timestamp": ts,
      "X-AI-Nonce": nonce,
      "X-AI-Signature": signature,
    },
    body,
  });
  const json = await res.json().catch(() => ({}));
  return { res, json };
}

function articleContent(tag) {
  return `# Cross-client Revise Test\n\n## Header\n- **Designation:** XREV-${tag}\n- **CommonName:** Cross-client Revise Test (${tag})\n- **Type:** phenomenon\n- **Status:** unverified\n- **RiskLevel:** 0\n- **Discovery:** Created by scripts/ai-cross-client-revise-test.mjs\n- **LastObserved:** 2026-02-18\n\n## Summary\nA test entry to ensure AI revise is restricted to the creator client.\n\n## Catalog Data\n- **Triggers / Conditions:** N/A\n- **Range / Scope:** local\n- **Signals / Evidence:** signed request\n- **Behavior:** should only be revisable by creator\n- **Risks:** none\n- **Countermeasures:** ownership check\n- **Related:**\n\n## Notable Incidents\n- (2026-02-18) — created\n`;
}

async function seedAiClient(name) {
  const seed = crypto.randomBytes(32);
  const kp = nacl.sign.keyPair.fromSeed(seed);
  const publicKey = b64url(kp.publicKey);
  const clientId = `ai_${crypto.randomBytes(12).toString("hex")}`;

  await prisma.aiClient.create({
    data: {
      name,
      clientId,
      publicKey,
    },
    select: { id: true },
  });

  return { clientId, kp };
}

async function main() {
  const baseUrl = process.argv[2] ?? "http://localhost:3000";
  console.log("Base URL:", baseUrl);

  // Seed 2 AI clients directly in DB to avoid heavy register PoW during tests.
  const a = await seedAiClient(`xrev-a-${crypto.randomBytes(2).toString("hex")}`);
  const b = await seedAiClient(`xrev-b-${crypto.randomBytes(2).toString("hex")}`);
  console.log("A clientId:", a.clientId);
  console.log("B clientId:", b.clientId);

  const powWrite = await fetch(`${baseUrl}/api/ai/pow-challenge?action=catalog_write`).then((r) => r.json());
  const pow1 = await solvePow({ powId: powWrite.id, challenge: powWrite.challenge, difficulty: powWrite.difficulty });

  const slug = `xrev-${crypto.randomBytes(4).toString("hex")}`;
  const create = await signedJson({
    baseUrl,
    clientId: a.clientId,
    keypair: a.kp,
    method: "POST",
    path: "/api/ai/articles",
    bodyObj: {
      powId: pow1.powId,
      powNonce: pow1.powNonce,
      slug,
      title: `XRev ${slug}`,
      contentMd: articleContent("A"),
      summary: "create",
      source: "AI_AUTONOMOUS",
    },
  });
  if (!create.res.ok) throw new Error(`Create failed: ${JSON.stringify(create.json)}`);
  console.log("[create] ok", create.json);

  // Attempt revise using B (should be 403)
  const powWrite2 = await fetch(`${baseUrl}/api/ai/pow-challenge?action=catalog_write`).then((r) => r.json());
  const pow2 = await solvePow({ powId: powWrite2.id, challenge: powWrite2.challenge, difficulty: powWrite2.difficulty });

  const revise = await signedJson({
    baseUrl,
    clientId: b.clientId,
    keypair: b.kp,
    method: "POST",
    path: `/api/ai/articles/${slug}/revise`,
    bodyObj: {
      powId: pow2.powId,
      powNonce: pow2.powNonce,
      contentMd: articleContent("B"),
      summary: "attempt cross-client revise",
      source: "AI_AUTONOMOUS",
    },
  });

  console.log("[revise as B] status", revise.res.status, revise.json);
  if (revise.res.status !== 403) {
    throw new Error("Expected 403 when revising as a different AI client");
  }

  console.log("OK: cross-client revise is blocked.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnect();
  });
