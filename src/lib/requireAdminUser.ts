import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function requireAdminUser(): Promise<
  { userId: string } | { res: Response }
> {
  const session = await auth();
  if (!session?.user) {
    return { res: Response.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const userId = (session.user as unknown as { id?: string } | null)?.id;
  if (!userId) {
    return { res: Response.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (user?.role !== "ADMIN") {
    return { res: Response.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { userId };
}
