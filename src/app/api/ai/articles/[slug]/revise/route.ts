import { prisma } from "@/lib/prisma";
import { verifyAiRequest } from "@/lib/aiAuth";
import { consumeAiWrite } from "@/lib/aiRateLimit";

export async function POST(
  req: Request,
  { params }: { params: { slug: string } },
) {
  const { slug } = params;
  const rawBody = await req.text();

  const auth = await verifyAiRequest({ req, rawBody });
  if (!auth.ok) {
    return Response.json({ error: auth.message }, { status: auth.status });
  }

  const article = await prisma.article.findUnique({
    where: { slug },
    select: { id: true, isCanon: true },
  });
  if (!article) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  // Canon: no auto-apply. For now, block AI writes here.
  if (article.isCanon) {
    return Response.json(
      { error: "Canon articles require admin approval" },
      { status: 403 },
    );
  }

  const rl = await consumeAiWrite(auth.aiClientId);
  if (!rl.ok) {
    return Response.json(
      { error: "Rate limited" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  let body: any;
  try {
    body = JSON.parse(rawBody || "{}");
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const contentMd = String(body.contentMd ?? "");
  const summary = body.summary ? String(body.summary) : null;
  const source = body.source === "AI_REQUEST" ? "AI_REQUEST" : "AI_AUTONOMOUS";

  if (!contentMd) {
    return Response.json({ error: "contentMd is required" }, { status: 400 });
  }

  const last = await prisma.articleRevision.findFirst({
    where: { articleId: article.id },
    orderBy: { revNumber: "desc" },
    select: { revNumber: true },
  });
  const nextRev = (last?.revNumber ?? 0) + 1;

  const rev = await prisma.articleRevision.create({
    data: {
      articleId: article.id,
      revNumber: nextRev,
      contentMd,
      summary,
      source,
      createdByAiClientId: auth.aiClientId,
    },
    select: { id: true },
  });

  await prisma.article.update({
    where: { id: article.id },
    data: { currentRevisionId: rev.id },
  });

  await prisma.aiActionLog.create({
    data: {
      aiClientId: auth.aiClientId,
      action: "UPDATE",
      articleId: article.id,
      status: "OK",
      meta: { slug, revNumber: nextRev },
    },
  });

  return Response.json({ ok: true, slug, revNumber: nextRev });
}
