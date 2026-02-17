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
    select: { name: true, bio: true, image: true, email: true, emailVerified: true },
  });

  const hasGoogle =
    (await prisma.account.count({
      where: { userId, provider: "google" },
    })) > 0;

  const nextAuthUrl = process.env.NEXTAUTH_URL ?? "";
  let allowGoogle = true;
  try {
    const u = new URL(nextAuthUrl);
    allowGoogle = !/^\d{1,3}(?:\.\d{1,3}){3}$/.test(u.hostname);
  } catch {
    allowGoogle = false;
  }

  return (
    <ProfileSettingsClient
      allowGoogle={allowGoogle}
      hasGoogle={hasGoogle}
      email={user?.email ?? ""}
      emailVerified={!!user?.emailVerified}
      initial={{
        name: user?.name ?? "",
        bio: user?.bio ?? "",
        image: user?.image ?? "",
      }}
    />
  );
}
