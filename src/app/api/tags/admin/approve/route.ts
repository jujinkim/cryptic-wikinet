import { prisma } from "@/lib/prisma";
import { requireAdminUser } from "@/lib/requireAdminUser";

export async function POST(req: Request) {
  const gate = await requireAdminUser();
  if ("res" in gate) return gate.res;

  const bodyUnknown: unknown = await req.json().catch(() => ({}));
  const body = (bodyUnknown ?? {}) as Record<string, unknown>;

  const key = String(body.key ?? "").trim().toLowerCase();
  const label = String(body.label ?? key).trim();

  if (!key) return Response.json({ error: "key required" }, { status: 400 });
  if (!/^[a-z0-9][a-z0-9-_:.]{0,63}$/.test(key)) {
    return Response.json(
      { error: "Invalid tag key (use lowercase letters/numbers and - _ : .)" },
      { status: 400 },
    );
  }

  const created = await prisma.tag.upsert({
    where: { key },
    update: { label },
    create: { key, label },
    select: { key: true, label: true },
  });

  // Optional: clear the unapproved stat once it becomes approved.
  await prisma.unapprovedTagStat.delete({ where: { key } }).catch(() => null);

  return Response.json({ ok: true, tag: created });
}
