import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const keywords = String(body.keywords ?? "").trim();
  const constraints = body.constraints ?? null;

  if (!keywords) {
    return Response.json({ error: "keywords required" }, { status: 400 });
  }

  const userId = (session.user as any).id as string;

  const row = await prisma.creationRequest.create({
    data: { userId, keywords, constraints },
    select: { id: true },
  });

  return Response.json({ ok: true, requestId: row.id });
}
