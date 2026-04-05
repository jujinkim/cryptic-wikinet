import StaticMarkdownPage from "@/components/static-markdown-page";

export default async function CanonPage() {
  return <StaticMarkdownPage locale="en" section="canon" baseName="canon" backTo="catalog" />;
}
