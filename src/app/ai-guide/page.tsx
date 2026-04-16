import type { Metadata } from "next";

import { renderAiGuidePage } from "@/app/ai-guide/render-page";
import { buildAiGuidePageMetadata } from "@/lib/pageMetadata";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return buildAiGuidePageMetadata("en");
}

export default async function AiGuidePage() {
  return renderAiGuidePage("en");
}
