import crypto from "node:crypto";

import { expect, test } from "@playwright/test";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";

const suffix = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
const email = `reward-${suffix}@example.com`;
const password = "RewardPass123!";
const aiAccountId = `aiacct_test_${suffix}`;
const clientId = `client-${suffix}`;
const article1Slug = `reward-confirmed-${suffix}`;
const article2Slug = `reward-pending-${suffix}`;

let userId = "";

test.beforeAll(async () => {
  const passwordHash = await bcrypt.hash(password, 12);
  const publicKey = crypto.randomBytes(32).toString("base64url");
  const request1Id = crypto.randomUUID();
  const request2Id = crypto.randomUUID();

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      emailVerified: new Date(),
      name: "Reward Test Member",
    },
    select: { id: true },
  });
  userId = user.id;

  await prisma.aiAccount.create({
    data: {
      id: aiAccountId,
      name: `Reward Test AI ${suffix}`,
      ownerUserId: userId,
    },
  });

  await prisma.aiClient.create({
    data: {
      name: `Reward Client ${suffix}`,
      clientId,
      publicKey,
      aiAccountId,
      ownerUserId: userId,
      status: "ACTIVE",
      ownerConfirmedAt: new Date(),
    },
  });

  await prisma.creationRequest.createMany({
    data: [
      {
        id: request1Id,
        userId,
        keywords: "confirmed request",
        status: "DONE",
        handledAt: new Date(),
      },
      {
        id: request2Id,
        userId,
        keywords: "pending request",
        status: "DONE",
        handledAt: new Date(),
      },
    ],
  });

  const article1 = await prisma.article.create({
    data: {
      slug: article1Slug,
      title: "Reward Confirmed Article",
      createdByAiAccountId: aiAccountId,
      createdByAiClientId: (await prisma.aiClient.findUniqueOrThrow({
        where: { clientId },
        select: { id: true },
      })).id,
    },
    select: { id: true },
  });

  const article2 = await prisma.article.create({
    data: {
      slug: article2Slug,
      title: "Reward Pending Article",
      createdByAiAccountId: aiAccountId,
      createdByAiClientId: (await prisma.aiClient.findUniqueOrThrow({
        where: { clientId },
        select: { id: true },
      })).id,
    },
    select: { id: true },
  });

  await prisma.memberRewardEvent.createMany({
    data: [
      {
        ownerUserId: userId,
        aiAccountId,
        articleId: article1.id,
        requestId: request1Id,
        kind: "REQUEST_ARTICLE_CREATE",
        status: "PENDING",
        points: 10,
        eligibleAt: new Date(Date.now() - 60_000),
        meta: { slug: article1Slug },
      },
      {
        ownerUserId: userId,
        aiAccountId,
        articleId: article2.id,
        requestId: request2Id,
        kind: "REQUEST_ARTICLE_CREATE",
        status: "PENDING",
        points: 5,
        eligibleAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        meta: { slug: article2Slug },
      },
    ],
  });
});

test.afterAll(async () => {
  await prisma.memberRewardEvent.deleteMany({ where: { ownerUserId: userId } });
  await prisma.article.deleteMany({ where: { slug: { in: [article1Slug, article2Slug] } } });
  await prisma.creationRequest.deleteMany({ where: { userId } });
  await prisma.aiClient.deleteMany({ where: { clientId } });
  await prisma.aiAccount.deleteMany({ where: { id: aiAccountId } });
  await prisma.verificationToken.deleteMany({ where: { identifier: email } });
  await prisma.account.deleteMany({ where: { userId } });
  await prisma.session.deleteMany({ where: { userId } });
  await prisma.user.deleteMany({ where: { id: userId } });
  await prisma.$disconnect();
});

test("verified member sees reward summary and account reward data on /me", async ({ page }) => {
  await page.goto("/login");

  await page.getByPlaceholder("Email").fill(email);
  await page.getByPlaceholder("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();

  await page.waitForURL(/\/$/);
  await page.goto("/me");

  await expect(page.getByRole("heading", { name: "Member rewards" })).toBeVisible();
  await expect(page.getByText("Confirmed points", { exact: true })).toBeVisible();
  await expect(page.getByText("Pending points", { exact: true })).toBeVisible();
  await expect(page.getByText("Confirmed works", { exact: true })).toBeVisible();
  await expect(page.getByText("Pending works", { exact: true })).toBeVisible();
  await expect(page.getByText(/^10$/).first()).toBeVisible();
  await expect(page.getByText(/^5$/).first()).toBeVisible();
  await expect(page.getByText(/Observer/)).toBeVisible();
  await expect(
    page.getByText(/Rewards · confirmed 10p · pending 5p · confirmed works 1 · pending works 1/),
  ).toBeVisible();

  const authState = await page.evaluate(async () => {
    const res = await fetch("/api/auth/check", { cache: "no-store" });
    return res.json();
  });
  expect(authState.authenticated).toBe(true);
  expect(authState.user?.email).toBe(email);

  const mine = await page.evaluate(async () => {
    const res = await fetch("/api/ai/accounts/mine", { cache: "no-store" });
    return res.json();
  });
  expect(Array.isArray(mine.items)).toBe(true);
  expect(mine.items[0]?.reward).toMatchObject({
    confirmedPoints: 10,
    pendingPoints: 5,
    confirmedWorks: 1,
    pendingWorks: 1,
  });
});
