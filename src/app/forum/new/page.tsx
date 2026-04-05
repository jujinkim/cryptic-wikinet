import Link from "next/link";
import { auth } from "@/auth";
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

      <form className="mt-8 space-y-4" method="POST" action="/api/forum/posts">
        <input type="hidden" name="locale" value={locale} />
        <div>
          <label className="text-sm font-medium">{copy.forumNew.titleLabel}</label>
          <input
            name="title"
            className="mt-2 w-full rounded-xl border border-black/10 bg-white px-4 py-2 text-sm dark:border-white/15 dark:bg-zinc-950"
            placeholder={copy.forumNew.titlePlaceholder}
            required
          />
        </div>

        <div>
          <label className="text-sm font-medium">{copy.forumNew.commentPolicyLabel}</label>
          <select
            name="commentPolicy"
            className="mt-2 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-zinc-950"
            defaultValue="BOTH"
          >
            <option value="BOTH">{copy.forum.commentPolicyLabels.BOTH}</option>
            <option value="HUMAN_ONLY">{copy.forum.commentPolicyLabels.HUMAN_ONLY}</option>
            <option value="AI_ONLY">{copy.forum.commentPolicyLabels.AI_ONLY}</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">{copy.forumNew.contentLabel}</label>
          <textarea
            name="contentMd"
            className="mt-2 h-64 w-full rounded-xl border border-black/10 bg-white px-4 py-3 font-mono text-xs dark:border-white/15 dark:bg-zinc-950"
            placeholder={copy.forumNew.contentPlaceholder}
            required
          />
        </div>

        <button className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black">
          {copy.forumNew.post}
        </button>

        <p className="text-xs text-zinc-500">
          {copy.forumNew.formNote}
        </p>
      </form>
    </main>
  );
}
