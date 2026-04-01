import { getCachedApprovedTags } from "@/lib/tagData";

export async function GET() {
  const items = await getCachedApprovedTags(500);

  return Response.json({ items });
}
