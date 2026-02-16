import Link from "next/link";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function MePage() {
  const session = await auth();
  const userId = (session?.user as unknown as { id?: string } | null)?.id;

  if (!userId) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-semibold">Login required</h1>
        <p className="mt-2 text-sm text-zinc-500">You need to login to view your profile.</p>
        <div className="mt-6">
          <Link className="underline" href="/login">
            Go to /login
          </Link>
        </div>
      </main>
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      bio: true,
      image: true,
      emailVerified: true,
      createdAt: true,
    },
  });

  if (!user) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-semibold">Not found</h1>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <header>
        <h1 className="text-3xl font-semibold">My profile</h1>
        <p className="mt-2 text-sm text-zinc-500">/me</p>
      </header>

      <section className="mt-8 rounded-2xl border border-black/10 bg-white p-6 dark:border-white/15 dark:bg-zinc-950">
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0">
            <div className="text-xl font-semibold">
              {user.name ?? "(no display name)"}
            </div>
            <div className="mt-1 text-sm text-zinc-500">{user.email}</div>
            {user.bio ? <div className="mt-3 text-sm">{user.bio}</div> : null}
            <div className="mt-4 text-xs text-zinc-500">
              Joined: {new Date(user.createdAt).toLocaleString()} · Email verified:{" "}
              {user.emailVerified ? "yes" : "no"}
            </div>
          </div>

          {user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.image}
              alt="avatar"
              className="h-16 w-16 shrink-0 rounded-full border border-black/10 object-cover dark:border-white/15"
            />
          ) : (
            <div className="h-16 w-16 shrink-0 rounded-full border border-dashed border-black/20 dark:border-white/20" />
          )}
        </div>

        <div className="mt-6 flex flex-wrap gap-3 text-sm">
          <Link className="underline" href="/settings/profile">
            Edit profile
          </Link>
          <Link className="underline" href="/settings/account">
            Account settings
          </Link>
          <Link className="underline" href={`/members/${user.id}`}>
            Public view
          </Link>
        </div>
      </section>
    </main>
  );
}
