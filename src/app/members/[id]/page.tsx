import Link from "next/link";

import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function MemberProfilePage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;

  if (!id) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-semibold">Not found</h1>
        <p className="mt-2 text-sm text-zinc-500">No such member.</p>
      </main>
    );
  }

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      bio: true,
      image: true,
      createdAt: true,
    },
  });

  if (!user) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-semibold">Not found</h1>
        <p className="mt-2 text-sm text-zinc-500">No such member.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">{user.name ?? "Member"}</h1>
          <p className="mt-2 text-sm text-zinc-500">/members/{user.id}</p>
        </div>
        {user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.image}
            alt="avatar"
            className="h-16 w-16 shrink-0 rounded-full border border-black/10 object-cover dark:border-white/15"
          />
        ) : null}
      </header>

      {user.bio ? (
        <section className="mt-6 rounded-2xl border border-black/10 bg-white p-6 text-sm dark:border-white/15 dark:bg-zinc-950">
          {user.bio}
        </section>
      ) : null}

      <div className="mt-6 text-xs text-zinc-500">
        Joined: {new Date(user.createdAt).toLocaleDateString()}
      </div>

      <div className="mt-10 text-sm">
        <Link className="underline" href="/">
          ← Home
        </Link>
      </div>
    </main>
  );
}
