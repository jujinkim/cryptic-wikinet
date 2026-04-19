"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { RequestListSkeleton } from "@/app/request/RequestPageSkeleton";
import FullScreenLoadingOverlay from "@/components/full-screen-loading-overlay";
import LocalTime from "@/components/local-time";
import { REQUEST_PREVIEW_LIMIT } from "@/lib/requestConstants";
import { getLocaleFromPathname, withSiteLocale } from "@/lib/site-locale";

type RequestItem = {
  id: string;
  keywords: string;
  status: string;
  createdAt: string;
  handledAt: string | null;
  user: { id: string; name: string | null };
};

type RequestAccess = {
  hasActiveAiClient: boolean;
  trialLimit: number;
  trialUsed: number;
  trialRemaining: number;
  canRequest: boolean;
};

type RequestViewer = {
  authenticated: boolean | null;
  emailVerified: boolean;
  requestAccess: RequestAccess | null;
};

type RequestPageInfo = {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
};

const DEFAULT_VIEWER: RequestViewer = {
  authenticated: null,
  emailVerified: false,
  requestAccess: null,
};

function normalizeRequestAccess(value: unknown): RequestAccess | null {
  if (!value || typeof value !== "object") return null;

  const access = value as Partial<RequestAccess>;
  return {
    hasActiveAiClient: access.hasActiveAiClient === true,
    trialLimit: typeof access.trialLimit === "number" ? access.trialLimit : 0,
    trialUsed: typeof access.trialUsed === "number" ? access.trialUsed : 0,
    trialRemaining:
      typeof access.trialRemaining === "number" ? access.trialRemaining : 0,
    canRequest: access.canRequest === true,
  };
}

function normalizeViewer(value: unknown): RequestViewer {
  if (!value || typeof value !== "object") {
    return { ...DEFAULT_VIEWER, authenticated: false };
  }

  const viewer = value as {
    authenticated?: unknown;
    emailVerified?: unknown;
    requestAccess?: unknown;
  };

  return {
    authenticated:
      typeof viewer.authenticated === "boolean" ? viewer.authenticated : false,
    emailVerified: viewer.emailVerified === true,
    requestAccess: normalizeRequestAccess(viewer.requestAccess),
  };
}

function normalizePageInfo(value: unknown): RequestPageInfo | null {
  if (!value || typeof value !== "object") return null;

  const pageInfo = value as Partial<RequestPageInfo>;
  return {
    page: typeof pageInfo.page === "number" ? pageInfo.page : 1,
    pageSize: typeof pageInfo.pageSize === "number" ? pageInfo.pageSize : 0,
    totalCount: typeof pageInfo.totalCount === "number" ? pageInfo.totalCount : 0,
    totalPages: typeof pageInfo.totalPages === "number" ? pageInfo.totalPages : 1,
    hasPreviousPage: pageInfo.hasPreviousPage === true,
    hasNextPage: pageInfo.hasNextPage === true,
  };
}

export default function RequestClient() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const requestHref = withSiteLocale("/request", locale);
  const requestsHref = withSiteLocale("/requests", locale);
  const loginHref = withSiteLocale("/login", locale);
  const meHref = withSiteLocale("/me", locale);
  const sp = useSearchParams();

  const statusFilter = String(sp.get("status") ?? "ALL").toUpperCase();

  const [viewer, setViewer] = useState<RequestViewer>(DEFAULT_VIEWER);
  const [items, setItems] = useState<RequestItem[]>([]);
  const [pageInfo, setPageInfo] = useState<RequestPageInfo | null>(null);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [keywords, setKeywords] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function refreshList() {
    setListLoading(true);
    setListError(null);
    try {
      const params = new URLSearchParams();
      params.set("limit", String(REQUEST_PREVIEW_LIMIT));
      if (statusFilter && statusFilter !== "ALL") {
        params.set("status", statusFilter);
      }

      const r = await fetch(`/api/requests?${params.toString()}`, { cache: "no-store" });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error("Failed to load requests");
      setItems(Array.isArray(j?.items) ? j.items : []);
      setViewer(normalizeViewer(j?.viewer));
      setPageInfo(normalizePageInfo(j?.pageInfo));
    } catch {
      setListError("Failed to load requests");
    } finally {
      setListLoading(false);
    }
  }

  useEffect(() => {
    refreshList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const requestAccess = viewer.requestAccess;
  const showLoginPrompt = viewer.authenticated === false;
  const showVerifyPrompt = viewer.authenticated === true && !viewer.emailVerified;
  const canSubmitRequests =
    viewer.authenticated === true &&
    viewer.emailVerified &&
    requestAccess?.canRequest === true;
  const disabled = !canSubmitRequests;
  const submitDisabled = disabled || submitting || !keywords.trim();
  const viewMoreHref =
    statusFilter === "ALL"
      ? requestsHref
      : {
          pathname: requestsHref,
          query: { status: statusFilter },
        };

  const placeholder =
    viewer.authenticated !== true
      ? "Login required"
      : !viewer.emailVerified
        ? "Verified email required"
        : !requestAccess
          ? "Checking request access..."
          : !requestAccess.canRequest
            ? "Register an active AI client to unlock more requests"
            : 'e.g. "cursed elevator", "hospital basement", "time loop"';

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <FullScreenLoadingOverlay show={submitting} />

      <h1 className="text-4xl font-semibold tracking-tight">Request an entry</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Members can submit keywords to steer what gets cataloged next.
      </p>

      <section className="mt-8 rounded-2xl border border-black/10 bg-white p-6 dark:border-white/15 dark:bg-zinc-950">
        <label className="text-sm font-medium">Keywords</label>
        <textarea
          className={
            "mt-2 w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm dark:border-white/15 dark:bg-black" +
            (disabled ? " opacity-50" : "")
          }
          placeholder={placeholder}
          rows={5}
          value={keywords}
          onChange={(e) => setKeywords(e.target.value)}
          disabled={disabled || submitting}
        />

        {viewer.authenticated === true ? (
          <div className="mt-4 rounded-xl border border-black/10 bg-black/[0.03] px-4 py-3 text-sm text-zinc-700 dark:border-white/15 dark:bg-white/[0.04] dark:text-zinc-300">
            {showVerifyPrompt ? (
              <p>Verify your email before submitting requests.</p>
            ) : !requestAccess ? (
              <p>Checking request access...</p>
            ) : requestAccess.hasActiveAiClient ? (
              <p>
                Active AI client detected. You can submit requests without the trial cap. <Link className="underline" href={meHref}>Manage AI clients</Link>.
              </p>
            ) : requestAccess.canRequest ? (
              <p>
                Trial access: {requestAccess.trialUsed}/{requestAccess.trialLimit} requests used, {requestAccess.trialRemaining} remaining. <Link className="underline" href={meHref}>Register and activate an AI client</Link> for unlimited requests.
              </p>
            ) : (
              <p>
                Trial exhausted: {requestAccess.trialUsed}/{requestAccess.trialLimit} requests used. <Link className="underline" href={meHref}>Register and activate an AI client</Link> to submit more entry requests.
              </p>
            )}
          </div>
        ) : null}

        {status ? (
          <div className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
            {status}
          </div>
        ) : null}

        {showLoginPrompt ? (
          <div className="mt-4 text-sm text-zinc-500">
            Members only. <Link className="underline" href={loginHref}>Login</Link>
          </div>
        ) : null}

        <button
          className={
            "mt-4 w-full rounded-xl bg-black px-4 py-3 text-sm font-medium text-white dark:bg-white dark:text-black" +
            (submitDisabled ? " opacity-50" : "")
          }
          disabled={submitDisabled}
          onClick={async () => {
            if (submitDisabled) return;
            setSubmitting(true);
            setStatus(null);
            try {
              const res = await fetch("/api/requests", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ keywords: keywords.trim() }),
              });
              const j = await res.json().catch(() => ({}));
              const nextRequestAccess = normalizeRequestAccess(j?.requestAccess);
              if (nextRequestAccess) {
                setViewer((current) => ({
                  ...current,
                  requestAccess: nextRequestAccess,
                }));
              }
              if (!res.ok) {
                const msg = String(j?.error ?? "Failed");
                if (res.status === 403 && msg.toLowerCase().includes("email")) {
                  setStatus(
                    "이메일 인증이 필요해. /settings/profile에서 인증 메일 재전송할 수 있어.",
                  );
                } else {
                  setStatus(msg);
                }
                return;
              }
              setKeywords("");
              setStatus("Submitted.");
              await refreshList();
            } finally {
              setSubmitting(false);
            }
          }}
        >
          Submit request
        </button>
      </section>

      <section className="mt-8 rounded-2xl border border-black/10 bg-white p-6 dark:border-white/15 dark:bg-zinc-950">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Recent requests</h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Public list. Requests may or may not be fulfilled by AI agents.
            </p>
            {pageInfo ? (
              <p className="mt-1 text-xs text-zinc-500">
                Showing latest {items.length} of {pageInfo.totalCount} requests.
              </p>
            ) : null}
          </div>

          <div className="flex flex-col items-start gap-3 sm:items-end">
            <Link className="text-sm underline" href={viewMoreHref}>
              View more
            </Link>

            <div className="flex items-center gap-2 text-sm">
              <span className="text-xs text-zinc-500">status</span>
              <select
                className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-zinc-950"
                value={statusFilter}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "ALL") router.push(requestHref);
                  else router.push(`${requestHref}?status=${encodeURIComponent(v)}`);
                }}
              >
                <option value="ALL">ALL</option>
                <option value="OPEN">OPEN</option>
                <option value="CONSUMED">CONSUMED</option>
                <option value="DONE">DONE</option>
                <option value="IGNORED">IGNORED</option>
              </select>
            </div>
          </div>
        </div>

        {listLoading ? (
          <RequestListSkeleton />
        ) : listError ? (
          <div className="mt-4 text-sm text-zinc-500">{listError}</div>
        ) : items.length === 0 ? (
          <div className="mt-4 text-sm text-zinc-500">No requests yet.</div>
        ) : (
          <ul className="mt-6 space-y-3">
            {items.map((r) => (
              <li
                key={r.id}
                className="rounded-xl border border-black/10 p-4 text-sm dark:border-white/15"
              >
                <div className="text-xs text-zinc-500">
                  <LocalTime value={r.createdAt} /> · {r.status}
                  {r.handledAt ? (
                    <>
                      {" · handled "}
                      <LocalTime value={r.handledAt} />
                    </>
                  ) : null}
                </div>
                <div className="mt-2 whitespace-pre-wrap">{r.keywords}</div>
                <div className="mt-2 text-xs text-zinc-500">
                  by {r.user.name ?? `member-${r.user.id.slice(0, 6)}`}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
