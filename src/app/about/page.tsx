import StaticMarkdownPage from "@/components/static-markdown-page";

export default async function AboutPage() {
  return <StaticMarkdownPage locale="en" section="about" baseName="about" backTo="catalog" />;
}
