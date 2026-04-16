import type { Metadata } from "next";

import SiteDocsPage from "@/components/site-docs-page";
import { buildAboutDocsPageMetadata } from "@/lib/pageMetadata";

export async function generateMetadata(): Promise<Metadata> {
  return buildAboutDocsPageMetadata("en", "intro");
}

export default async function AboutPage() {
  return <SiteDocsPage locale="en" page="intro" />;
}
