import { Prisma } from "@prisma/client";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  getRequestAccessErrorMessage,
  getRequestAccessForUser,
} from "@/lib/requestAccess";
import { REQUEST_API_MAX_PAGE_SIZE } from "@/lib/requestConstants";
import {
  getPublicRequestFeed,
  parsePositivePageParam,
  parseRequestPageSizeParam,
  parseRequestQueryParam,
  parseRequestStatusParam,
  reopenExpiredConsumedRequests,
} from "@/lib/requestData";
import { requireVerifiedUser } from "@/lib/requireVerifiedUser";

type SessionUserLike = {
  id?: string | null;
} | null;

async function buildRequestViewer(userId: string | null) {
  if (!userId) {
    return {
      authenticated: false,
      emailVerified: false,
      requestAccess: null,
    };
  }

  const [user, requestAccess] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { emailVerified: true },
    }),
    getRequestAccessForUser(userId),
  ]);

  return {
    authenticated: true,
    emailVerified: !!user?.emailVerified,
    requestAccess,
  };
}

export async function GET(req: Request) {
  await reopenExpiredConsumedRequests();

  const url = new URL(req.url);
  const status = parseRequestStatusParam(url.searchParams.get("status"));
  const query = parseRequestQueryParam(url.searchParams.get("query"));
  const page = parsePositivePageParam(url.searchParams.get("page"), 1);
  const pageSize = parseRequestPageSizeParam(
    url.searchParams.get("limit"),
    REQUEST_API_MAX_PAGE_SIZE,
  );

  const session = await auth();
  const viewerUserId =
    ((session?.user as SessionUserLike)?.id as string | null | undefined) ?? null;

  const [feed, viewer] = await Promise.all([
    getPublicRequestFeed({ status, query, page, pageSize }),
    buildRequestViewer(viewerUserId),
  ]);

  return Response.json({
    items: feed.items,
    viewer,
    pageInfo: feed.pageInfo,
  });
}

function isSerializableConflict(error: unknown) {
  return (error as { code?: string } | null)?.code === "P2034";
}

export async function POST(req: Request) {
  const gate = await requireVerifiedUser();
  if ("res" in gate) return gate.res;

  const body = await req.json().catch(() => ({}));
  const keywords = String(body.keywords ?? "").trim();
  const constraints = body.constraints ?? null;

  if (!keywords) {
    return Response.json({ error: "keywords required" }, { status: 400 });
  }

  const userId = gate.userId;

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const result = await prisma.$transaction(
        async (tx) => {
          const requestAccess = await getRequestAccessForUser(userId, tx);
          if (!requestAccess.canRequest) {
            return {
              ok: false as const,
              requestAccess,
            };
          }

          const row = await tx.creationRequest.create({
            data: { userId, keywords, constraints },
            select: { id: true },
          });

          return {
            ok: true as const,
            requestId: row.id,
          };
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        },
      );

      if (!result.ok) {
        return Response.json(
          {
            error: getRequestAccessErrorMessage(result.requestAccess),
            requestAccess: result.requestAccess,
          },
          { status: 403 },
        );
      }

      return Response.json({ ok: true, requestId: result.requestId });
    } catch (error) {
      if (attempt < 1 && isSerializableConflict(error)) {
        continue;
      }
      throw error;
    }
  }

  return Response.json({ error: "Failed to submit request" }, { status: 500 });
}
