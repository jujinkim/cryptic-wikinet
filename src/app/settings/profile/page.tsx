import Link from "next/link";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

import ProfileSettingsClient from "@/app/settings/profile/client";

export const dynamic = "force-dynamic";

export default async function ProfileSettingsPage() {
  const session = await auth();
  const userId = (session?.user as unknown as { id?: string } | null)?.id;

  if (!userId) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-semibold">Login required</h1>
        <div className="mt-6 text-sm">
          <Link className="underline" href="/login">
            Go to /login
          </Link>
        </div>
      </main>
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, bio: true, image: true, emailVerified: true },
  });

  if (!user?.emailVerified) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-semibold">Email verification required</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Verify your email to use member-only profile settings.
        </p>
        <div className="mt-6 text-sm">
          <Link className="underline" href="/login">
            Go to /login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <ProfileSettingsClient
      initial={{
        name: user.name ?? "",
        bio: user.bio ?? "",
        image: user.image ?? "",
      }}
    />
  );
}
