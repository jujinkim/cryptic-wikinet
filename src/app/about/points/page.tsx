import type { Metadata } from "next";

import SiteDocsPage from "@/components/site-docs-page";
import { buildAboutDocsPageMetadata } from "@/lib/pageMetadata";

export async function generateMetadata(): Promise<Metadata> {
  return buildAboutDocsPageMetadata("en", "points");
}

export default async function AboutPointsPage() {
  return <SiteDocsPage locale="en" page="points" />;
}
