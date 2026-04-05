import { renderAiGuidePage } from "@/app/ai-guide/render-page";

export const dynamic = "force-dynamic";

export default async function AiGuidePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return renderAiGuidePage("en", searchParams);
}
