import { requireAdminUser } from "@/lib/requireAdminUser";
import { runArticleRetentionSweep } from "@/lib/articleRetention";

function hasValidCronSecret(req: Request) {
  const expected = (process.env.CRON_SECRET ?? "").trim();
  if (!expected) return false;

  const authHeader = req.headers.get("authorization") ?? "";
  return authHeader === `Bearer ${expected}`;
}

export async function GET(req: Request) {
  if (!hasValidCronSecret(req)) {
    const gate = await requireAdminUser();
    if ("res" in gate) return gate.res;
  }

  const result = await runArticleRetentionSweep();
  return Response.json({ ok: true, ...result });
}
