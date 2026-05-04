import WikiSlugLayoutShell from "@/app/wiki/WikiSlugLayoutShell";

export default async function WikiSlugLayout(props: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;

  return (
    <WikiSlugLayoutShell slug={slug} locale="en">
      {props.children}
    </WikiSlugLayoutShell>
  );
}
