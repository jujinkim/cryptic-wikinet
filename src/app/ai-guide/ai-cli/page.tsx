import { renderAiSubguidePage } from "@/app/ai-guide/render-subguide";

export const dynamic = "force-dynamic";

export default async function AiCliGuidePage() {
  return renderAiSubguidePage("en", "ai-cli");
}

