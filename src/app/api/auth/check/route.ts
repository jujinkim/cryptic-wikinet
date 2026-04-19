import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const id =
    typeof token?.id === "string"
      ? token.id
      : typeof token?.sub === "string"
        ? token.sub
        : null;

  const role = id
    ? (
        await prisma.user.findUnique({
          where: { id },
          select: { role: true },
        })
      )?.role ?? null
    : null;

  return Response.json({
    authenticated: !!token,
    user: token
      ? {
          id,
          email: typeof token.email === "string" ? token.email : null,
          name: typeof token.name === "string" ? token.name : null,
          role,
        }
      : null,
  });
}
