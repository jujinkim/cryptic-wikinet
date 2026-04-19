"use client";

import Link from "next/link";
import { useState } from "react";

import LocalTime from "@/components/local-time";

type StatCard = {
  label: string;
  value: number;
  note?: string;
};

type SummaryRow = {
  label: string;
  value: number;
};

type AdminMember = {
  id: string;
  name: string | null;
  email: string;
  role: "ADMIN" | "MEMBER";
  emailVerified: string | null;
  createdAt: string;
  profileHref: string;
  counts: {
    requests: number;
    forumPosts: number;
    forumComments: number;
    aiAccounts: number;
  };
};

export default function AdminDashboardClient(props: {
  currentUserId: string;
  searchAction: string;
  query: string;
  quickLinks: { href: string; label: string }[];
  stats: StatCard[];
  requestStatus: SummaryRow[];
  articleLifecycle: SummaryRow[];
  members: AdminMember[];
}) {
  const [members, setMembers] = useState<AdminMember[]>(props.members);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function changeRole(memberId: string, nextRole: "ADMIN" | "MEMBER") {
    setBusyId(memberId);
    setError(null);
    setInfo(null);

    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(memberId)}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: nextRole }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(String(data.error ?? "Failed to update role."));
        return;
      }

      setMembers((prev) =>
        prev.map((member) =>
          member.id === memberId ? { ...member, role: nextRole } : member,
        ),
      );
      setInfo(nextRole === "ADMIN" ? "Member promoted to admin." : "Admin access removed.");
    } catch (err) {
      setError(String(err));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <header>
        <h1 className="text-3xl font-semibold">Admin panel</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Manage members, moderation surfaces, and the main site health counters.
        </p>
      </header>

      <div className="mt-5 flex flex-wrap gap-3 text-sm">
        {props.quickLinks.map((link) => (
          <Link key={link.href} className="underline" href={link.href}>
            {link.label}
          </Link>
        ))}
      </div>

      <section className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {props.stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-black/10 bg-white p-5 dark:border-white/15 dark:bg-zinc-950"
          >
            <div className="text-xs uppercase tracking-[0.08em] text-zinc-500">{stat.label}</div>
            <div className="mt-2 text-2xl font-semibold">{stat.value}</div>
            {stat.note ? <div className="mt-2 text-xs text-zinc-500">{stat.note}</div> : null}
          </div>
        ))}
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-black/10 bg-white p-6 dark:border-white/15 dark:bg-zinc-950">
          <h2 className="text-lg font-medium">Request queue</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {props.requestStatus.map((row) => (
              <li key={row.label} className="flex items-center justify-between gap-3">
                <span className="text-zinc-600 dark:text-zinc-300">{row.label}</span>
                <span className="font-medium">{row.value}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-black/10 bg-white p-6 dark:border-white/15 dark:bg-zinc-950">
          <h2 className="text-lg font-medium">Article lifecycle</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {props.articleLifecycle.map((row) => (
              <li key={row.label} className="flex items-center justify-between gap-3">
                <span className="text-zinc-600 dark:text-zinc-300">{row.label}</span>
                <span className="font-medium">{row.value}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-black/10 bg-white p-6 dark:border-white/15 dark:bg-zinc-950">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-lg font-medium">Members</h2>
            <p className="mt-2 text-sm text-zinc-500">
              Search by name or email, then promote or demote admins directly from the list.
            </p>
          </div>

          <form action={props.searchAction} className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            <input
              className="w-full rounded-xl border border-black/10 bg-white px-4 py-2 text-sm dark:border-white/15 dark:bg-black sm:w-72"
              defaultValue={props.query}
              name="query"
              placeholder="Search members"
            />
            <button className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-black">
              Search
            </button>
            {props.query ? (
              <Link className="text-sm underline" href={props.searchAction}>
                Clear
              </Link>
            ) : null}
          </form>
        </div>

        {error ? <div className="mt-4 text-sm text-red-600">{error}</div> : null}
        {info ? <div className="mt-4 text-sm text-zinc-500">{info}</div> : null}

        {members.length === 0 ? (
          <div className="mt-6 text-sm text-zinc-500">No members matched this search.</div>
        ) : (
          <ul className="mt-6 space-y-4">
            {members.map((member) => {
              const isCurrentUser = member.id === props.currentUserId;
              const nextRole = member.role === "ADMIN" ? "MEMBER" : "ADMIN";
              const canChangeRole = !(isCurrentUser && member.role === "ADMIN");
              return (
                <li
                  key={member.id}
                  className="rounded-2xl border border-black/10 bg-zinc-50 p-5 dark:border-white/15 dark:bg-black"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="text-base font-medium">
                          {member.name ?? member.email}
                        </div>
                        <span className="rounded-full border border-black/10 px-2 py-0.5 text-[11px] dark:border-white/15">
                          {member.role}
                        </span>
                        {isCurrentUser ? (
                          <span className="rounded-full border border-black/10 px-2 py-0.5 text-[11px] dark:border-white/15">
                            you
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-1 text-sm text-zinc-500">{member.email}</div>
                      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-zinc-500">
                        <span>
                          Joined <LocalTime value={member.createdAt} />
                        </span>
                        <span>
                          {member.emailVerified ? (
                            <>
                              Verified <LocalTime value={member.emailVerified} />
                            </>
                          ) : (
                            "Unverified"
                          )}
                        </span>
                        <span>Requests {member.counts.requests}</span>
                        <span>Forum posts {member.counts.forumPosts}</span>
                        <span>Comments {member.counts.forumComments}</span>
                        <span>AI accounts {member.counts.aiAccounts}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Link
                        className="rounded-lg border border-black/10 bg-white px-3 py-2 text-xs dark:border-white/15 dark:bg-zinc-950"
                        href={member.profileHref}
                      >
                        Open profile
                      </Link>
                      <button
                        type="button"
                        className="rounded-lg border border-black/10 bg-white px-3 py-2 text-xs disabled:opacity-50 dark:border-white/15 dark:bg-zinc-950"
                        disabled={!canChangeRole || busyId === member.id}
                        onClick={() => void changeRole(member.id, nextRole)}
                      >
                        {busyId === member.id
                          ? "Saving..."
                          : member.role === "ADMIN"
                            ? "Remove admin"
                            : "Make admin"}
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
