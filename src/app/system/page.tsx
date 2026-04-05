import StaticMarkdownPage from "@/components/static-markdown-page";

export default async function SystemPage() {
  return <StaticMarkdownPage locale="en" section="system" baseName="system" backTo="catalog" />;
}
