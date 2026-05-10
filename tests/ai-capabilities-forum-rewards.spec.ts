import "dotenv/config";

import crypto from "node:crypto";

import { expect, test } from "@playwright/test";
import nacl from "tweetnacl";

import { prisma } from "../src/lib/prisma";
import { getRequestAccessForUser } from "../src/lib/requestAccess";

test.describe.configure({ mode: "serial" });

const suffix = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
const email = `ai-cap-${suffix}@example.com`;
const aiAccountId = `aiacct_cap_${suffix}`;
const clientId = `client-cap-${suffix}`;
const requestId = crypto.randomUUID();
const keyPair = nacl.sign.keyPair();

let userId = "";
let aiClientDbId = "";

function sha256Hex(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

function signedHeaders(args: {
  method: string;
  path: string;
  body: string;
}) {
  const timestamp = String(Date.now());
  const nonce = crypto.randomUUID();
  const canonical = [
    args.method.toUpperCase(),
    args.path,
    timestamp,
    nonce,
    sha256Hex(args.body),
    "",
  ].join("\n");
  const signature = nacl.sign.detached(Buffer.from(canonical, "utf8"), keyPair.secretKey);

  return {
    "x-ai-client-id": clientId,
    "x-ai-timestamp": timestamp,
    "x-ai-nonce": nonce,
    "x-ai-signature": Buffer.from(signature).toString("base64url"),
  };
}

test.beforeAll(async () => {
  const user = await prisma.user.create({
    data: {
      email,
      emailVerified: new Date(),
      name: "AI Capability Test Member",
    },
    select: { id: true },
  });
  userId = user.id;

  await prisma.aiAccount.create({
    data: {
      id: aiAccountId,
      name: `AI Capability Test ${suffix}`,
      ownerUserId: userId,
    },
  });

  const client = await prisma.aiClient.create({
    data: {
      name: `AI Capability Client ${suffix}`,
      clientId,
      publicKey: Buffer.from(keyPair.publicKey).toString("base64url"),
      aiAccountId,
      ownerUserId: userId,
      status: "ACTIVE",
      ownerConfirmedAt: new Date(),
    },
    select: { id: true },
  });
  aiClientDbId = client.id;

  await prisma.creationRequest.create({
    data: {
      id: requestId,
      userId,
      keywords: `capability queue request ${suffix}`,
      status: "OPEN",
    },
  });
});

test.afterAll(async () => {
  await prisma.memberRewardEvent.deleteMany({ where: { ownerUserId: userId } });
  await prisma.forumComment.deleteMany({ where: { authorAiClientId: aiClientDbId } });
  await prisma.forumPost.deleteMany({ where: { authorAiClientId: aiClientDbId } });
  await prisma.creationRequest.deleteMany({ where: { id: requestId } });
  await prisma.powChallenge.deleteMany({
    where: { challenge: { startsWith: `pow-cap-${suffix}` } },
  });
  await prisma.userCapability.deleteMany({ where: { userId } });
  await prisma.aiClient.deleteMany({ where: { id: aiClientDbId } });
  await prisma.aiAccount.deleteMany({ where: { id: aiAccountId } });
  await prisma.user.deleteMany({ where: { id: userId } });
  await prisma.$disconnect();
});

test("request submission access requires the explicit request capability", async () => {
  expect((await getRequestAccessForUser(userId)).canRequest).toBe(false);

  await prisma.userCapability.create({
    data: {
      userId,
      key: "REQUEST_CREATE",
      grantedAt: new Date(),
    },
  });

  expect((await getRequestAccessForUser(userId)).canRequest).toBe(true);
});

test("catalog request queue requires catalog AI writer capability", async ({ request }) => {
  const blocked = await request.get("/api/ai/queue/requests?limit=1", {
    headers: signedHeaders({
      method: "GET",
      path: "/api/ai/queue/requests",
      body: "",
    }),
  });
  expect(blocked.status()).toBe(403);
  await expect(blocked.json()).resolves.toMatchObject({
    error: "catalog_ai_write_required",
  });

  await prisma.userCapability.create({
    data: {
      userId,
      key: "CATALOG_AI_WRITE",
      grantedAt: new Date(),
    },
  });

  const allowed = await request.get("/api/ai/queue/requests?limit=1", {
    headers: signedHeaders({
      method: "GET",
      path: "/api/ai/queue/requests",
      body: "",
    }),
  });
  expect(allowed.status()).toBe(200);
});

test("AI forum post creates a pending forum reward", async ({ request }) => {
  const pow = await prisma.powChallenge.create({
    data: {
      challenge: `pow-cap-${suffix}-forum-post`,
      action: "forum_post",
      difficulty: 0,
      expiresAt: new Date(Date.now() + 60_000),
    },
    select: { id: true },
  });
  const body = JSON.stringify({
    powId: pow.id,
    powNonce: "anything",
    title: `AI forum reward ${suffix}`,
    contentMd: "Forum reward fixture.",
    commentPolicy: "BOTH",
  });

  const res = await request.post("/api/ai/forum/posts", {
    data: body,
    headers: {
      "content-type": "application/json",
      ...signedHeaders({
        method: "POST",
        path: "/api/ai/forum/posts",
        body,
      }),
    },
  });
  expect(res.status()).toBe(200);
  const json = await res.json();
  expect(json.ok).toBe(true);

  const reward = await prisma.memberRewardEvent.findFirst({
    where: {
      ownerUserId: userId,
      forumPostId: json.id,
      kind: "FORUM_POST_CREATE",
    },
    select: {
      status: true,
      points: true,
      aiAccountId: true,
      forumPostId: true,
    },
  });

  expect(reward).toMatchObject({
    status: "PENDING",
    points: 2,
    aiAccountId,
    forumPostId: json.id,
  });
});
