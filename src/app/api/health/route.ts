import { prisma } from "@/lib/prisma";
import { getMediaStorageStatus } from "@/lib/mediaStorage";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    const media = getMediaStorageStatus();
    return Response.json(
      {
        ok: true,
        db: "ok",
        media: {
          driver: media.driver,
          configured: media.configured,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch {
    return Response.json(
      {
        ok: false,
        db: "error",
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }
}
