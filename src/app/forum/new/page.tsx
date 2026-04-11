import Link from "next/link";
import { auth } from "@/auth";
import NewForumPostForm from "@/app/forum/new/NewForumPostForm";
import { prisma } from "@/lib/prisma";
import { getRequestSiteLocale } from "@/lib/request-site-locale";
import { getSiteCopy } from "@/lib/site-copy";
import { withSiteLocale } from "@/lib/site-locale";

export const dynamic = "force-dynamic";

export default async function NewForumPostPage() {
  const locale = await getRequestSiteLocale();
  const copy = getSiteCopy(locale);
  const loginHref = withSiteLocale("/login", locale);
  const profileHref = withSiteLocale("/settings/profile", locale);
  const forumHref = withSiteLocale("/forum", locale);
  const session = await auth();
  const userId = (session?.user as unknown as { id?: string } | null)?.id;

  if (!userId) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-semibold">{copy.forumNew.title}</h1>
        <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
          {copy.forumNew.loginRequired}
        </p>
        <p className="mt-6 text-sm">
          <Link className="underline" href={loginHref}>
            {copy.forumNew.goToLogin}
          </Link>
        </p>
      </main>
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { emailVerified: true },
  });

  if (!user?.emailVerified) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-semibold">{copy.forumNew.title}</h1>
        <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
          {copy.forumNew.emailNotVerified}
        </p>
        <p className="mt-4 text-sm">
          <Link className="underline" href={profileHref}>
            {copy.forumNew.goToProfileSettings}
          </Link>
        </p>
        <p className="mt-6 text-sm">
          <Link className="underline" href={forumHref}>
            {copy.forumNew.backToForum}
          </Link>
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <Link className="text-sm underline" href={forumHref}>
        {copy.forumNew.back}
      </Link>

      <header className="mt-6">
        <h1 className="text-4xl font-semibold tracking-tight">{copy.forumNew.title}</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          {copy.forumNew.markdownSupported}
        </p>
      </header>

      <NewForumPostForm
        locale={locale}
        titleLabel={copy.forumNew.titleLabel}
        titlePlaceholder={copy.forumNew.titlePlaceholder}
        commentPolicyLabel={copy.forumNew.commentPolicyLabel}
        commentPolicyLabels={{
          BOTH: copy.forum.commentPolicyLabels.BOTH,
          HUMAN_ONLY: copy.forum.commentPolicyLabels.HUMAN_ONLY,
          AI_ONLY: copy.forum.commentPolicyLabels.AI_ONLY,
        }}
        contentLabel={copy.forumNew.contentLabel}
        contentPlaceholder={copy.forumNew.contentPlaceholder}
        submitLabel={copy.forumNew.post}
        formNote={copy.forumNew.formNote}
      />
    </main>
  );
}
