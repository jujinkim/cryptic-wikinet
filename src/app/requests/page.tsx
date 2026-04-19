import Link from "next/link";

import LocalTime from "@/components/local-time";
import { REQUEST_LIST_PAGE_SIZE } from "@/lib/requestConstants";
import {
  getPublicRequestFeed,
  parsePositivePageParam,
  parseRequestQueryParam,
  parseRequestStatusParam,
  reopenExpiredConsumedRequests,
} from "@/lib/requestData";
import { getRequestSiteLocale } from "@/lib/request-site-locale";
import { withSiteLocale } from "@/lib/site-locale";

function buildPageTokens(page: number, totalPages: number) {
  const pages = new Set<number>([
    1,
    totalPages,
    page - 2,
    page - 1,
    page,
    page + 1,
    page + 2,
  ]);

  const sorted = [...pages]
    .filter((value) => value >= 1 && value <= totalPages)
    .sort((a, b) => a - b);
  const tokens: Array<number | "gap"> = [];

  for (const nextPage of sorted) {
    const prev = tokens[tokens.length - 1];
    if (typeof prev === "number" && nextPage - prev > 1) {
      tokens.push("gap");
    }
    tokens.push(nextPage);
  }

  return tokens;
}

function buildRequestsQuery(args: {
  status?: string;
  query?: string;
  page?: number;
}) {
  const nextQuery: Record<string, string> = {};
  if (args.status) nextQuery.status = args.status;
  if (args.query) nextQuery.query = args.query;
  if ((args.page ?? 1) > 1) nextQuery.page = String(args.page);
  return nextQuery;
}

export const dynamic = "force-dynamic";

export default async function RequestsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const locale = await getRequestSiteLocale();
  const sp = await searchParams;
  const status = parseRequestStatusParam(sp.status);
  const query = parseRequestQueryParam(sp.query);
  const currentPage = parsePositivePageParam(sp.page, 1);
  const activeStatus = status ?? "ALL";

  await reopenExpiredConsumedRequests();
  const { items, pageInfo } = await getPublicRequestFeed({
    status,
    query,
    page: currentPage,
    pageSize: REQUEST_LIST_PAGE_SIZE,
  });

  const requestEntryHref = withSiteLocale("/request", locale);
  const requestsHref = withSiteLocale("/requests", locale);
  const pageTokens = buildPageTokens(pageInfo.page, pageInfo.totalPages);
  const rangeStart =
    pageInfo.totalCount === 0 ? 0 : (pageInfo.page - 1) * pageInfo.pageSize + 1;
  const rangeEnd =
    pageInfo.totalCount === 0
      ? 0
      : Math.min(pageInfo.page * pageInfo.pageSize, pageInfo.totalCount);

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <div className="mb-6 text-sm">
        <Link className="underline" href={requestEntryHref}>
          Back to request entry
        </Link>
      </div>

      <header className="flex flex-col gap-2">
        <h1 className="text-4xl font-semibold tracking-tight">Request feed</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Public request list with pagination and keyword search.
        </p>
      </header>

      <section className="mt-8 rounded-2xl border border-black/10 bg-white p-6 dark:border-white/15 dark:bg-zinc-950">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <Link
              className={activeStatus === "ALL" ? "font-medium underline" : "underline"}
              href={{
                pathname: requestsHref,
                query: buildRequestsQuery({ query }),
              }}
            >
              ALL
            </Link>
            <Link
              className={activeStatus === "OPEN" ? "font-medium underline" : "underline"}
              href={{
                pathname: requestsHref,
                query: buildRequestsQuery({ status: "OPEN", query }),
              }}
            >
              OPEN
            </Link>
            <Link
              className={activeStatus === "CONSUMED" ? "font-medium underline" : "underline"}
              href={{
                pathname: requestsHref,
                query: buildRequestsQuery({ status: "CONSUMED", query }),
              }}
            >
              CONSUMED
            </Link>
            <Link
              className={activeStatus === "DONE" ? "font-medium underline" : "underline"}
              href={{
                pathname: requestsHref,
                query: buildRequestsQuery({ status: "DONE", query }),
              }}
            >
              DONE
            </Link>
            <Link
              className={activeStatus === "IGNORED" ? "font-medium underline" : "underline"}
              href={{
                pathname: requestsHref,
                query: buildRequestsQuery({ status: "IGNORED", query }),
              }}
            >
              IGNORED
            </Link>
          </div>

          <form className="flex gap-2" method="GET" action={requestsHref}>
            {status ? <input type="hidden" name="status" value={status} /> : null}
            <input
              className="w-full rounded-xl border border-black/10 bg-white px-4 py-2 text-sm dark:border-white/15 dark:bg-black sm:w-64"
              name="query"
              placeholder="Search request keywords"
              defaultValue={query}
            />
            <button className="rounded-xl bg-black px-3 py-2 text-sm font-medium text-white dark:bg-white dark:text-black">
              Search
            </button>
          </form>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-zinc-500">
          <span>
            Showing {rangeStart}-{rangeEnd} of {pageInfo.totalCount} requests.
          </span>
          {query ? (
            <span>
              Search: <span className="font-medium text-zinc-700 dark:text-zinc-300">{query}</span>
            </span>
          ) : null}
        </div>

        {items.length === 0 ? (
          <div className="mt-6 text-sm text-zinc-500">
            {query ? "No matching requests." : "No requests yet."}
          </div>
        ) : (
          <ul className="mt-6 space-y-3">
            {items.map((item) => (
              <li
                key={item.id}
                className="rounded-xl border border-black/10 p-4 text-sm dark:border-white/15"
              >
                <div className="text-xs text-zinc-500">
                  <LocalTime value={item.createdAt} /> · {item.status}
                  {item.handledAt ? (
                    <>
                      {" · handled "}
                      <LocalTime value={item.handledAt} />
                    </>
                  ) : null}
                </div>
                <div className="mt-2 whitespace-pre-wrap">{item.keywords}</div>
                <div className="mt-2 text-xs text-zinc-500">
                  by {item.user.name ?? `member-${item.user.id.slice(0, 6)}`}
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-8 flex flex-wrap items-center gap-2 text-sm">
          {pageInfo.hasPreviousPage ? (
            <Link
              className="rounded-lg border border-black/10 px-3 py-2 dark:border-white/15"
              href={{
                pathname: requestsHref,
                query: buildRequestsQuery({
                  status: status ?? undefined,
                  query,
                  page: pageInfo.page - 1,
                }),
              }}
            >
              Previous
            </Link>
          ) : (
            <span className="rounded-lg border border-black/10 px-3 py-2 text-zinc-400 dark:border-white/15 dark:text-zinc-500">
              Previous
            </span>
          )}

          {pageTokens.map((token, index) =>
            token === "gap" ? (
              <span key={`gap-${index}`} className="px-1 text-zinc-400">
                ...
              </span>
            ) : token === pageInfo.page ? (
              <span
                key={token}
                className="rounded-lg bg-black px-3 py-2 text-white dark:bg-white dark:text-black"
              >
                {token}
              </span>
            ) : (
              <Link
                key={token}
                className="rounded-lg border border-black/10 px-3 py-2 dark:border-white/15"
                href={{
                  pathname: requestsHref,
                  query: buildRequestsQuery({
                    status: status ?? undefined,
                    query,
                    page: token,
                  }),
                }}
              >
                {token}
              </Link>
            ),
          )}

          {pageInfo.hasNextPage ? (
            <Link
              className="rounded-lg border border-black/10 px-3 py-2 dark:border-white/15"
              href={{
                pathname: requestsHref,
                query: buildRequestsQuery({
                  status: status ?? undefined,
                  query,
                  page: pageInfo.page + 1,
                }),
              }}
            >
              Next
            </Link>
          ) : (
            <span className="rounded-lg border border-black/10 px-3 py-2 text-zinc-400 dark:border-white/15 dark:text-zinc-500">
              Next
            </span>
          )}

          <span className="ml-auto text-xs text-zinc-500">
            Page {pageInfo.page} / {pageInfo.totalPages}
          </span>
        </div>
      </section>
    </main>
  );
}
