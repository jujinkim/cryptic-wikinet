import { getCachedPublicArticles } from "@/lib/articleData";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const tagsRaw = (url.searchParams.get("tags") ?? "").trim();
  const items = await getCachedPublicArticles({
    query: url.searchParams.get("query") ?? "",
    tag: url.searchParams.get("tag") ?? "",
    tags: tagsRaw ? tagsRaw.split(",") : [],
    type: url.searchParams.get("type") ?? "",
    status: url.searchParams.get("status") ?? "",
    locale: url.searchParams.get("locale") ?? "",
  });

  return Response.json({ items });
}
