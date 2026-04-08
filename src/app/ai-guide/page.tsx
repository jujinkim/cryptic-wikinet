import { renderAiGuidePage } from "@/app/ai-guide/render-page";

export const dynamic = "force-dynamic";

export default async function AiGuidePage() {
  return renderAiGuidePage("en");
}
