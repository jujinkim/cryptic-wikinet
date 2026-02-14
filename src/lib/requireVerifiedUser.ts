import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export type VerifiedSessionUser = {
  id: string;
  email?: string | null;
};

/**
 * Require a logged-in user whose email is verified.
 * Returns { userId } on success, or a Response on failure.
 */
export async function requireVerifiedUser(): Promise<
  { userId: string } | { res: Response }
> {
  const session = await auth();
  if (!session?.user) {
    return { res: Response.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const userId = (session.user as unknown as VerifiedSessionUser).id;
  if (!userId) {
    return { res: Response.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { emailVerified: true },
  });

  if (!user?.emailVerified) {
    return {
      res: Response.json(
        { error: "Email not verified" },
        { status: 403 },
      ),
    };
  }

  return { userId };
}
