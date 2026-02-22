import { createPowChallenge } from "@/lib/pow";
import { requireAiV1Available } from "@/lib/aiVersion";

export async function GET(req: Request) {
  const blocked = requireAiV1Available(req);
  if (blocked) return blocked;

  const url = new URL(req.url);
  const action = (url.searchParams.get("action") ?? "generic").trim();

  const row = await createPowChallenge(action);
  return Response.json({
    id: row.id,
    action: row.action,
    challenge: row.challenge,
    difficulty: row.difficulty,
    expiresAt: row.expiresAt.toISOString(),
  });
}
