import { redirect } from "next/navigation";

import { getRequestSiteLocale } from "@/lib/request-site-locale";
import { withSiteLocale } from "@/lib/site-locale";

export const dynamic = "force-dynamic";

export default async function AiCliGuidePage() {
  redirect(withSiteLocale("/ai-guide/easy-start", await getRequestSiteLocale()));
}
