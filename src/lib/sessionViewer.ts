import { auth } from "@/auth";
import type { UserRole } from "@prisma/client";

export async function getSessionViewer() {
  const session = await auth();
  const viewer = (session?.user as unknown as { id?: string; role?: UserRole } | null) ?? null;
  return {
    userId: viewer?.id ?? null,
    role: viewer?.role ?? null,
  };
}
