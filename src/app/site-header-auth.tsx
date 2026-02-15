"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";

export default function SiteHeaderAuth(props: {
  user: { email?: string | null; name?: string | null } | null;
}) {
  const user = props.user;

  if (!user) {
    return (
      <div className="flex items-center gap-3 text-sm">
        <Link className="underline" href="/login">
          Login
        </Link>
        <Link className="underline" href="/signup">
          Sign up
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="hidden text-xs text-zinc-500 sm:inline">
        {user.name ?? user.email ?? "Member"}
      </span>
      <button
        className="underline"
        onClick={() => signOut({ callbackUrl: "/" })}
        type="button"
      >
        Logout
      </button>
    </div>
  );
}
