import type { Prisma, RequestStatus } from "@prisma/client";

import { publicArticleWhere } from "@/lib/articleAccess";
import { prisma } from "@/lib/prisma";
import { REQUEST_API_MAX_PAGE_SIZE } from "@/lib/requestConstants";
import { getRequestConsumeLeaseCutoff } from "@/lib/requestLease";

const REQUEST_STATUS_VALUES = ["OPEN", "CONSUMED", "IGNORED", "DONE"] as const;
const REQUEST_STATUS_SET = new Set<string>(REQUEST_STATUS_VALUES);

export type PublicRequestPageInfo = {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
};

export type LinkedRequestArticle = {
  slug: string;
  title: string;
};

type RequestArticleLinkCandidate = {
  id: string;
  status: RequestStatus;
  rewardEvent?: { articleId: string | null } | null;
};

export function parseRequestStatusParam(
  value: string | string[] | null | undefined,
): RequestStatus | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  const normalized = String(raw ?? "").trim().toUpperCase();
  if (!REQUEST_STATUS_SET.has(normalized)) return undefined;
  return normalized as RequestStatus;
}

export function parseRequestQueryParam(
  value: string | string[] | null | undefined,
) {
  const raw = Array.isArray(value) ? value[0] : value;
  return typeof raw === "string" ? raw.trim() : "";
}

export function parsePositivePageParam(
  value: string | string[] | null | undefined,
  fallback = 1,
) {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(String(raw ?? ""), 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function parseRequestPageSizeParam(
  value: string | string[] | null | undefined,
  fallback: number,
) {
  const parsed = parsePositivePageParam(value, fallback);
  return Math.min(Math.max(parsed, 1), REQUEST_API_MAX_PAGE_SIZE);
}

export async function reopenExpiredConsumedRequests(now = new Date()) {
  await prisma.creationRequest.updateMany({
    where: {
      status: "CONSUMED",
      handledAt: { lt: getRequestConsumeLeaseCutoff(now) },
    },
    data: {
      status: "OPEN",
      handledAt: null,
      consumedByAiAccountId: null,
      consumedByAiClientId: null,
    },
  });
}

export async function getLinkedArticlesForRequests(
  requests: RequestArticleLinkCandidate[],
): Promise<Map<string, LinkedRequestArticle>> {
  const doneRequests = requests.filter((request) => request.status === "DONE");
  if (doneRequests.length === 0) return new Map();

  const articleIdsByRequestId = new Map<string, string>();
  for (const request of doneRequests) {
    if (request.rewardEvent?.articleId) {
      articleIdsByRequestId.set(request.id, request.rewardEvent.articleId);
    }
  }

  const requestIdsMissingRewardArticle = doneRequests
    .filter((request) => !articleIdsByRequestId.has(request.id))
    .map((request) => request.id);

  if (requestIdsMissingRewardArticle.length > 0) {
    const actionLogs = await prisma.aiActionLog.findMany({
      where: {
        requestId: { in: requestIdsMissingRewardArticle },
        action: "CREATE",
        status: "OK",
        articleId: { not: null },
      },
      orderBy: { createdAt: "asc" },
      select: {
        requestId: true,
        articleId: true,
      },
    });

    for (const actionLog of actionLogs) {
      if (!actionLog.requestId || !actionLog.articleId) continue;
      if (articleIdsByRequestId.has(actionLog.requestId)) continue;
      articleIdsByRequestId.set(actionLog.requestId, actionLog.articleId);
    }
  }

  const articleIds = [...new Set(articleIdsByRequestId.values())];
  if (articleIds.length === 0) return new Map();

  const articles = await prisma.article.findMany({
    where: {
      id: { in: articleIds },
      ...publicArticleWhere(),
    },
    select: {
      id: true,
      slug: true,
      title: true,
    },
  });

  const articlesById = new Map(articles.map((article) => [article.id, article]));
  const linkedArticlesByRequestId = new Map<string, LinkedRequestArticle>();

  for (const [requestId, articleId] of articleIdsByRequestId.entries()) {
    const article = articlesById.get(articleId);
    if (article) {
      linkedArticlesByRequestId.set(requestId, {
        slug: article.slug,
        title: article.title,
      });
    }
  }

  return linkedArticlesByRequestId;
}

export async function getPublicRequestFeed(args: {
  status?: RequestStatus;
  query?: string;
  page?: number;
  pageSize?: number;
}) {
  const status = args.status;
  const query = args.query?.trim() ?? "";
  const page = Number.isInteger(args.page) && (args.page ?? 0) > 0 ? Number(args.page) : 1;
  const pageSize = Math.min(
    Math.max(args.pageSize ?? REQUEST_API_MAX_PAGE_SIZE, 1),
    REQUEST_API_MAX_PAGE_SIZE,
  );

  const where: Prisma.CreationRequestWhereInput = {};
  if (status) {
    where.status = status;
  }
  if (query) {
    where.keywords = {
      contains: query,
      mode: "insensitive",
    };
  }

  const totalCount = await prisma.creationRequest.count({ where });
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const currentPage = Math.min(page, totalPages);

  const rows = await prisma.creationRequest.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (currentPage - 1) * pageSize,
    take: pageSize,
    select: {
      id: true,
      keywords: true,
      constraints: true,
      status: true,
      createdAt: true,
      handledAt: true,
      consumedByAiClientId: true,
      rewardEvent: {
        select: {
          articleId: true,
        },
      },
      user: { select: { id: true, name: true } },
    },
  });

  const linkedArticles = await getLinkedArticlesForRequests(rows);
  const items = rows.map((row) => ({
    id: row.id,
    keywords: row.keywords,
    constraints: row.constraints,
    status: row.status,
    createdAt: row.createdAt,
    handledAt: row.handledAt,
    consumedByAiClientId: row.consumedByAiClientId,
    user: row.user,
    linkedArticle: linkedArticles.get(row.id) ?? null,
  }));

  const pageInfo: PublicRequestPageInfo = {
    page: currentPage,
    pageSize,
    totalCount,
    totalPages,
    hasPreviousPage: currentPage > 1,
    hasNextPage: currentPage < totalPages,
  };

  return { items, pageInfo };
}
