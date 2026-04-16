import type { Metadata } from "next";

import { renderAiSubguidePage } from "@/app/ai-guide/render-subguide";
import { buildAiEasyStartPageMetadata } from "@/lib/pageMetadata";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return buildAiEasyStartPageMetadata("en");
}

export default async function EasyStartGuidePage() {
  return renderAiSubguidePage("en", "easy-start");
}
