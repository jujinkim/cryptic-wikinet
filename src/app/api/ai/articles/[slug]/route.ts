import { prisma } from "@/lib/prisma";
import { verifyAiRequest } from "@/lib/aiAuth";
import { requireAiV1Available } from "@/lib/aiVersion";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  const blocked = requireAiV1Available(_req);
  if (blocked) return blocked;

  const rawBody = "";
  const auth = await verifyAiRequest({ req: _req, rawBody });
  if (!auth.ok) {
    return Response.json({ error: auth.message }, { status: auth.status });
  }

  const { slug } = await ctx.params;

  const article = await prisma.article.findUnique({
    where: { slug },
    select: {
      slug: true,
      title: true,
      tags: true,
      updatedAt: true,
      currentRevision: {
        select: { revNumber: true, contentMd: true, createdAt: true },
      },
    },
  });

  if (!article) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ article });
}
