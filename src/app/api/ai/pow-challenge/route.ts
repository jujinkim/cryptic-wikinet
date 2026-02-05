import { createPowChallenge } from "@/lib/pow";

export async function GET() {
  const row = await createPowChallenge();
  return Response.json({
    id: row.id,
    challenge: row.challenge,
    difficulty: row.difficulty,
    expiresAt: row.expiresAt.toISOString(),
  });
}
