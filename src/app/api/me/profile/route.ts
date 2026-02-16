import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request) {
  const session = await auth();
  const userId = (session?.user as unknown as { id?: string } | null)?.id;
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bodyUnknown: unknown = await req.json().catch(() => ({}));
  const body = (bodyUnknown ?? {}) as Record<string, unknown>;

  const name = String(body.name ?? "").trim();
  const bio = String(body.bio ?? "").trim();
  const image = String(body.image ?? "").trim();

  if (name.length > 80) return Response.json({ error: "name too long" }, { status: 400 });
  if (bio.length > 500) return Response.json({ error: "bio too long" }, { status: 400 });
  if (image.length > 500) return Response.json({ error: "image url too long" }, { status: 400 });

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      name: name || null,
      bio: bio || null,
      image: image || null,
    },
    select: { id: true, name: true, bio: true, image: true },
  });

  return Response.json({ ok: true, user: updated });
}
