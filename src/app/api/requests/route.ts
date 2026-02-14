import { prisma } from "@/lib/prisma";
import { requireVerifiedUser } from "@/lib/requireVerifiedUser";

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

  const row = await prisma.creationRequest.create({
    data: { userId, keywords, constraints },
    select: { id: true },
  });

  return Response.json({ ok: true, requestId: row.id });
}
