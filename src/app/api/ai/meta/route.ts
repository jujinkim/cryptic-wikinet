import { aiVersionHeadersFor, getAiApiMeta } from "@/lib/aiVersion";

export async function GET(req: Request) {
  const origin = new URL(req.url).origin;
  const meta = getAiApiMeta({ origin });
  return Response.json({ ok: true, ...meta }, { headers: aiVersionHeadersFor(req) });
}
