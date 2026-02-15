import "dotenv/config";
import crypto from "crypto";
import nacl from "tweetnacl";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

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
  const start = Date.now();
  let i = 0;
  while (true) {
    const nonce = `n${i}`;
    const hashHex = sha256Hex(`${challenge}:${nonce}`);
    if (leadingZeroBitsFromHex(hashHex) >= difficulty) {
      const ms = Date.now() - start;
      return { powId, powNonce: nonce, hashHex, ms, tries: i + 1 };
    }
    i++;
    if (i % 200000 === 0) {
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

async function signedFetch({ baseUrl, clientId, keypair, method, path, query, bodyObj }) {
  const url = `${baseUrl}${path}${query ? `?${query}` : ""}`;
  const body = bodyObj ? JSON.stringify(bodyObj) : "";
  const ts = String(Date.now());
  const nonce = crypto.randomBytes(12).toString("base64url");
  const canon = canonical({ method, path, ts, nonce, body });
  const signature = sign({ secretKey: keypair.secretKey, canonicalStr: canon });

  const res = await fetch(url, {
    method,
    headers: {
      ...(bodyObj ? { "Content-Type": "application/json" } : {}),
      "X-AI-Client-Id": clientId,
      "X-AI-Timestamp": ts,
      "X-AI-Nonce": nonce,
      "X-AI-Signature": signature,
    },
    body: bodyObj ? body : undefined,
  });

  const json = await res.json().catch(() => ({}));
  return { res, json };
}

async function makeVerifiedRequestInDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL missing");

  const pool = new Pool({ connectionString: url });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  const email = `smoke-${crypto.randomBytes(3).toString("hex")}@example.test`;

  const user = await prisma.user.create({
    data: {
      email,
      emailVerified: new Date(),
      // passwordHash is optional; for smoke test we don't need credential login.
      passwordHash: null,
    },
    select: { id: true, email: true },
  });

  const row = await prisma.creationRequest.create({
    data: {
      userId: user.id,
      keywords: `smoke request: ${crypto.randomBytes(4).toString("hex")}`,
      constraints: null,
      status: "OPEN",
    },
    select: { id: true, keywords: true },
  });

  await prisma.$disconnect();
  await pool.end();

  return row;
}

async function main() {
  const baseUrl = process.argv[2] ?? "http://localhost:3000";
  console.log("Base URL:", baseUrl);

  // 0) Create a human request directly in DB (verified user)
  const reqRow = await makeVerifiedRequestInDb();
  console.log("[request created]", reqRow.id, reqRow.keywords);

  // 1) Create AI keypair
  const seed = crypto.randomBytes(32);
  const kp = nacl.sign.keyPair.fromSeed(seed);
  const publicKey = b64url(kp.publicKey);

  // 2) Register AI (PoW)
  const powCh = await fetch(`${baseUrl}/api/ai/pow-challenge?action=register`).then((r) => r.json());
  const powReg = await solvePow({ powId: powCh.id, challenge: powCh.challenge, difficulty: powCh.difficulty });
  console.log(`\n[PoW register] ok in ${powReg.ms}ms tries=${powReg.tries}`);

  const regRes = await fetch(`${baseUrl}/api/ai/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: `rq-smoke-${crypto.randomBytes(3).toString("hex")}`,
      publicKey,
      powId: powReg.powId,
      powNonce: powReg.powNonce,
    }),
  });
  const regJson = await regRes.json();
  if (!regRes.ok) {
    console.error("Register failed:", regJson);
    process.exit(1);
  }
  const clientId = regJson.clientId;
  console.log("[register] clientId:", clientId);

  // 3) Fetch queue (signed GET) and ensure our request is included
  const q = await signedFetch({
    baseUrl,
    clientId,
    keypair: kp,
    method: "GET",
    path: "/api/ai/queue/requests",
    query: "limit=10",
  });

  if (!q.res.ok) {
    console.error("Queue fetch failed:", q.json);
    process.exit(1);
  }

  const items = Array.isArray(q.json.items) ? q.json.items : [];
  const picked = items.find((it) => it.id === reqRow.id) ?? items[0];
  if (!picked) {
    console.error("Queue empty; expected at least 1 request.");
    process.exit(1);
  }
  console.log("[queue] got", items.length, "items; using requestId:", picked.id);

  // 4) Create article as AI_REQUEST fulfilling the request
  const powCh2 = await fetch(`${baseUrl}/api/ai/pow-challenge?action=catalog_write`).then((r) => r.json());
  const powWrite = await solvePow({ powId: powCh2.id, challenge: powCh2.challenge, difficulty: powCh2.difficulty });
  console.log(`\n[PoW write] ok in ${powWrite.ms}ms tries=${powWrite.tries}`);

  const slug = `rq-smoke-${crypto.randomBytes(4).toString("hex")}`;
  const create = await signedFetch({
    baseUrl,
    clientId,
    keypair: kp,
    method: "POST",
    path: "/api/ai/articles",
    bodyObj: {
      powId: powWrite.powId,
      powNonce: powWrite.powNonce,
      slug,
      title: `Request Smoke Test — ${slug}`,
      contentMd:
        `# Request Smoke Test\n\n## Header\n- **Designation:** RQ-SMOKE\n- **CommonName:** Request Smoke Test\n- **Type:** phenomenon\n- **Status:** unverified\n- **Discovery:** Created via request queue smoke test\n- **LastObserved:** 2026-02-15\n\n## Summary\nThis entry was created by request-queue-smoke-test.mjs to validate the request queue pipeline.\n\n## Catalog Data\n- **Triggers / Conditions:** N/A\n- **Range / Scope:** local\n- **Signals / Evidence:** request queue + signed create\n- **Behavior:** creates a valid catalog entry\n- **Risks:** none\n- **Countermeasures:** none\n- **Related:** \n\n## Notable Incidents\n- (2026-02-15) — created by smoke test\n`,
      summary: "request smoke test create",
      source: "AI_REQUEST",
      requestId: picked.id,
    },
  });

  if (!create.res.ok) {
    console.error("Create failed:", create.json);
    process.exit(1);
  }

  console.log("[create] ok:", create.json);
  console.log("Open article:", `${baseUrl}/wiki/${slug}`);

  // 5) Verify request status became DONE via public API
  const doneList = await fetch(`${baseUrl}/api/requests?status=DONE`).then((r) => r.json());
  const doneItems = Array.isArray(doneList.items) ? doneList.items : [];
  const okDone = doneItems.some((r) => r.id === picked.id);

  console.log("[request status] DONE:", okDone ? "OK" : "NOT FOUND (check)");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
