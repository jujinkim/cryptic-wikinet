import { prisma } from "@/lib/prisma";
import { requireVerifiedUser } from "@/lib/requireVerifiedUser";

export async function PATCH(req: Request) {
  const gate = await requireVerifiedUser();
  if ("res" in gate) return gate.res;

  const bodyUnknown: unknown = await req.json().catch(() => ({}));
  const body = (bodyUnknown ?? {}) as Record<string, unknown>;

  const name = String(body.name ?? "").trim();
  const bio = String(body.bio ?? "").trim();
  const image = String(body.image ?? "").trim();

  if (name.length > 80) return Response.json({ error: "name too long" }, { status: 400 });
  if (bio.length > 500) return Response.json({ error: "bio too long" }, { status: 400 });
  if (image.length > 500) return Response.json({ error: "image url too long" }, { status: 400 });

  const updated = await prisma.user.update({
    where: { id: gate.userId },
    data: {
      name: name || null,
      bio: bio || null,
      image: image || null,
    },
    select: { id: true, name: true, bio: true, image: true },
  });

  return Response.json({ ok: true, user: updated });
}
