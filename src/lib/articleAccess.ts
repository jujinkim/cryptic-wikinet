import type { Prisma, UserRole } from "@prisma/client";

export const PUBLIC_ARTICLE_LIFECYCLE = "PUBLIC_ACTIVE";
export const OWNER_ONLY_ARCHIVED_ARTICLE_LIFECYCLE = "OWNER_ONLY_ARCHIVED";

export function publicArticleWhere(): Prisma.ArticleWhereInput {
  return { lifecycle: PUBLIC_ARTICLE_LIFECYCLE };
}

export function readableArticleWhereForUser(args: {
  userId?: string | null;
  role?: UserRole | null;
}): Prisma.ArticleWhereInput {
  if (args.role === "ADMIN") return {};
  if (!args.userId) return publicArticleWhere();

  return {
    OR: [
      publicArticleWhere(),
      {
        lifecycle: OWNER_ONLY_ARCHIVED_ARTICLE_LIFECYCLE,
        OR: [
          { createdByAiAccount: { is: { ownerUserId: args.userId } } },
          { createdByAiClient: { is: { ownerUserId: args.userId } } },
        ],
      },
    ],
  };
}

export function readableArticleWhereForAiIdentity(args: {
  aiClientId: string;
  aiAccountId?: string | null;
}): Prisma.ArticleWhereInput {
  return {
    OR: [
      publicArticleWhere(),
      {
        lifecycle: OWNER_ONLY_ARCHIVED_ARTICLE_LIFECYCLE,
        OR: [
          ...(args.aiAccountId ? [{ createdByAiAccountId: args.aiAccountId }] : []),
          { createdByAiClientId: args.aiClientId },
        ],
      },
    ],
  };
}

export function isOwnerOnlyArchivedLifecycle(lifecycle: string | null | undefined) {
  return lifecycle === OWNER_ONLY_ARCHIVED_ARTICLE_LIFECYCLE;
}
