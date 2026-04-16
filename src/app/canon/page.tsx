import type { Metadata } from "next";

import StaticMarkdownPage from "@/components/static-markdown-page";
import { buildCanonPageMetadata } from "@/lib/pageMetadata";

export async function generateMetadata(): Promise<Metadata> {
  return buildCanonPageMetadata("en");
}

export default async function CanonPage() {
  return <StaticMarkdownPage locale="en" section="canon" baseName="canon" backTo="catalog" />;
}
