import { prisma } from "@/lib/prisma";
import { requireVerifiedUser } from "@/lib/requireVerifiedUser";

function asTargetType(s: string):
  | "FORUM_POST"
  | "FORUM_COMMENT"
  | "ARTICLE"
  | "ARTICLE_REVISION"
  | null {
  const u = s.toUpperCase();
  if (u === "FORUM_POST" || u === "FORUM_COMMENT" || u === "ARTICLE" || u === "ARTICLE_REVISION") {
    return u;
  }
  return null;
}

async function validateTarget(targetType: string, targetRef: string) {
  if (targetType === "FORUM_POST") {
    const ok = await prisma.forumPost.findUnique({ where: { id: targetRef }, select: { id: true } });
    return !!ok;
  }
  if (targetType === "FORUM_COMMENT") {
    const ok = await prisma.forumComment.findUnique({ where: { id: targetRef }, select: { id: true } });
    return !!ok;
  }
  if (targetType === "ARTICLE") {
    const ok = await prisma.article.findUnique({ where: { slug: targetRef }, select: { slug: true } });
    return !!ok;
  }
  if (targetType === "ARTICLE_REVISION") {
    const m = /^(.+)@(\d+)$/.exec(targetRef);
    if (!m) return false;
    const slug = m[1]!;
    const revNumber = Number(m[2]!);
    if (!Number.isFinite(revNumber) || revNumber < 1) return false;

    const art = await prisma.article.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!art) return false;

    const rev = await prisma.articleRevision.findUnique({
      where: { articleId_revNumber: { articleId: art.id, revNumber } },
      select: { id: true },
    });
    return !!rev;
  }

  return false;
}

export async function POST(req: Request) {
  const gate = await requireVerifiedUser();
  if ("res" in gate) return gate.res;

  const bodyUnknown: unknown = await req.json().catch(() => ({}));
  const body = (bodyUnknown ?? {}) as Record<string, unknown>;

  const targetTypeRaw = String(body.targetType ?? "").trim();
  const targetType = asTargetType(targetTypeRaw);
  const targetRef = String(body.targetRef ?? "").trim();
  const reason = body.reason ? String(body.reason).trim() : null;

  if (!targetType || !targetRef) {
    return Response.json(
      { error: "targetType and targetRef are required" },
      { status: 400 },
    );
  }

  const ok = await validateTarget(targetType, targetRef);
  if (!ok) {
    return Response.json({ error: "Invalid target" }, { status: 400 });
  }

  const row = await prisma.report.create({
    data: {
      targetType,
      targetRef,
      reason,
      reporterUserId: gate.userId,
    },
    select: { id: true, createdAt: true },
  });

  return Response.json({ ok: true, id: row.id, createdAt: row.createdAt });
}
