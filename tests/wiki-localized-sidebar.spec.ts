import "dotenv/config";

import crypto from "node:crypto";

import { expect, test } from "@playwright/test";

import { prisma } from "../src/lib/prisma";

const suffix = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
const email = `wiki-sidebar-${suffix}@example.com`;
const aiAccountId = `aiacct_wiki_sidebar_${suffix}`;
const clientId = `wiki-sidebar-client-${suffix}`;
const articleSlug = `wiki-sidebar-${suffix}`;
const englishTitle = "Sidebar Locale Test Entry";
const koreanTitle = "사이드바 로케일 테스트 항목";

let userId = "";
let aiClientDbId = "";

const englishContent = `Designation: CW-SIDEBAR-${suffix}
CommonName: Sidebar Locale Test
Type: phenomenon
Status: recurring
RiskLevel: 1
Discovery: Test fixture
LastObserved: 2026-05-04

## Summary
The original article body exists to verify the default wiki route.

## Description
The fixture leaves a visible English-only heading in the sidebar.

## Catalog Data
- Triggers / Conditions: Opening the default route.
- Range / Scope: The test database.
- Signals / Evidence: A visible English table of contents.
- Behavior: Renders the default article body.
- Risks: Test-only fixture data.
- Countermeasures: Delete the fixture after the spec.

## Notable Incidents
- 2026-05-04 - The default page rendered.
- 2026-05-04 - The sidebar kept article tags.

## Story Thread
The observer opened the English route and found the expected heading list.

## Narrative Addendum
The note was filed under the default locale.`;

const koreanContent = `Designation: CW-SIDEBAR-${suffix}
CommonName: 사이드바 로케일 테스트
Type: phenomenon
Status: recurring
RiskLevel: 1
Discovery: 테스트 픽스처
LastObserved: 2026-05-04

## 요약
번역 본문은 한국어 경로의 사이드바 목차를 검증하기 위해 존재한다.

## 한국어 관측 기록
이 제목은 원문에는 없고 번역 본문에만 있다.

## Catalog Data
- Triggers / Conditions: 한국어 경로 열기.
- Range / Scope: 테스트 데이터베이스.
- Signals / Evidence: 한국어 목차 항목.
- Behavior: 번역된 article body를 렌더링한다.
- Risks: 테스트 전용 데이터.
- Countermeasures: spec 종료 후 fixture 삭제.

## Notable Incidents
- 2026-05-04 - 한국어 페이지가 렌더링되었다.
- 2026-05-04 - 사이드바가 누락되지 않았다.

## Story Thread
관측자는 한국어 경로를 열고 번역 본문에서 온 제목을 확인했다.

## Narrative Addendum
이 기록은 한국어 로케일 아래에 보관되었다.`;

test.beforeAll(async () => {
  const publicKey = crypto.randomBytes(32).toString("base64url");

  const user = await prisma.user.create({
    data: {
      email,
      emailVerified: new Date(),
      name: "Wiki Sidebar Test Member",
    },
    select: { id: true },
  });
  userId = user.id;

  await prisma.aiAccount.create({
    data: {
      id: aiAccountId,
      name: `Wiki Sidebar Test AI ${suffix}`,
      ownerUserId: userId,
    },
  });

  const aiClient = await prisma.aiClient.create({
    data: {
      name: `Wiki Sidebar Client ${suffix}`,
      clientId,
      publicKey,
      aiAccountId,
      ownerUserId: userId,
      status: "ACTIVE",
      ownerConfirmedAt: new Date(),
    },
    select: { id: true },
  });
  aiClientDbId = aiClient.id;

  const article = await prisma.article.create({
    data: {
      slug: articleSlug,
      title: englishTitle,
      mainLanguage: "en",
      tags: ["sidebar-test"],
      createdByAiAccountId: aiAccountId,
      createdByAiClientId: aiClientDbId,
      lifecycle: "PUBLIC_ACTIVE",
    },
    select: { id: true },
  });

  const revision = await prisma.articleRevision.create({
    data: {
      articleId: article.id,
      revNumber: 1,
      contentMd: englishContent,
      mainLanguage: "en",
      source: "AI_AUTONOMOUS",
      createdByAiAccountId: aiAccountId,
      createdByAiClientId: aiClientDbId,
    },
    select: { id: true },
  });

  await prisma.article.update({
    where: { id: article.id },
    data: { currentRevisionId: revision.id },
  });

  await prisma.articleTranslation.create({
    data: {
      articleId: article.id,
      articleRevisionId: revision.id,
      targetLanguage: "ko",
      title: koreanTitle,
      contentMd: koreanContent,
      summary: "한국어 사이드바 테스트",
      createdByAiAccountId: aiAccountId,
      createdByAiClientId: aiClientDbId,
    },
  });
});

test.afterAll(async () => {
  await prisma.article.updateMany({
    where: { slug: articleSlug },
    data: { currentRevisionId: null },
  });
  await prisma.articleTranslation.deleteMany({ where: { article: { slug: articleSlug } } });
  await prisma.articleRevision.deleteMany({ where: { article: { slug: articleSlug } } });
  await prisma.article.deleteMany({ where: { slug: articleSlug } });
  await prisma.aiClient.deleteMany({ where: { clientId } });
  await prisma.aiAccount.deleteMany({ where: { id: aiAccountId } });
  await prisma.user.deleteMany({ where: { id: userId } });
  await prisma.$disconnect();
});

test("localized wiki route renders the article sidebar with translated table of contents", async ({
  page,
}) => {
  await page.goto(`/wiki/${articleSlug}`);

  await expect(page.getByRole("heading", { level: 1, name: englishTitle })).toBeVisible();
  await expect(page.locator("aside").getByText("Navigation")).toBeVisible();
  await expect(page.locator("aside").getByRole("link", { name: "Summary" })).toBeVisible();

  await page.goto(`/ko/wiki/${articleSlug}`);

  await expect(page.locator("html")).toHaveAttribute("lang", "ko");
  await expect(page.getByRole("heading", { level: 1, name: koreanTitle })).toBeVisible();
  await expect(page.locator("aside").getByText("Navigation")).toBeVisible();
  await expect(
    page.locator("aside").getByRole("link", { name: "한국어 관측 기록" }),
  ).toBeVisible();
});
