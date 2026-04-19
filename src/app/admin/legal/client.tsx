"use client";

import Link from "next/link";
import { useState } from "react";

import LocalTime from "@/components/local-time";

type HistoryItem = {
  id: string;
  contentMd: string;
  createdAt: string;
  revNumber: number;
  createdBy: string;
};

type LegalDocumentAdminItem = {
  id: string;
  slug: string;
  locale: string;
  localeLabel: string;
  title: string;
  publicHref: string;
  currentRevision: {
    contentMd: string;
    createdAt: string;
    revNumber: number;
  } | null;
  bundledDefault: {
    contentMd: string;
    createdAt: string;
  };
  history: HistoryItem[];
};

export default function LegalAdminClient(props: {
  adminLinks: { href: string; label: string }[];
  documents: LegalDocumentAdminItem[];
}) {
  const [drafts, setDrafts] = useState<Record<string, string>>(
    Object.fromEntries(
      props.documents.map((doc) => [doc.id, doc.currentRevision?.contentMd ?? doc.bundledDefault.contentMd]),
    ),
  );
  const [busyId, setBusyId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [infos, setInfos] = useState<Record<string, string | null>>({});

  function setError(id: string, message: string | null) {
    setErrors((prev) => ({ ...prev, [id]: message }));
  }

  function setInfo(id: string, message: string | null) {
    setInfos((prev) => ({ ...prev, [id]: message }));
  }

  function resetEditor(id: string, contentMd: string) {
    setDrafts((prev) => ({ ...prev, [id]: contentMd }));
    setError(id, null);
    setInfo(id, null);
  }

  function loadRevision(id: string, revision: HistoryItem) {
    setDrafts((prev) => ({ ...prev, [id]: revision.contentMd }));
    setError(id, null);
    setInfo(id, `Loaded revision ${revision.revNumber} into the editor. Save to publish it as the current version.`);
  }

  async function save(doc: LegalDocumentAdminItem) {
    const contentMd = drafts[doc.id] ?? "";
    if (!contentMd.trim()) {
      setError(doc.id, "Content is required.");
      setInfo(doc.id, null);
      return;
    }

    setBusyId(doc.id);
    setError(doc.id, null);
    setInfo(doc.id, null);
    try {
      const res = await fetch("/api/legal-docs/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: doc.slug, locale: doc.locale, contentMd }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(doc.id, String(data.error ?? "Save failed."));
        return;
      }
      if (data.unchanged) {
        setInfo(doc.id, "No changes detected. Current revision left unchanged.");
        return;
      }
      window.location.reload();
    } catch (error) {
      setError(doc.id, String(error));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="text-3xl font-semibold">Legal documents</h1>
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
        Manage the public privacy policy and terms pages by language. Bundled default markdown ships with the repo, and saving here publishes a new override revision only when the content changes.
      </p>

      <div className="mt-5 flex flex-wrap gap-3 text-sm">
        {props.adminLinks.map((link) => (
          <Link key={link.href} className="underline" href={link.href}>
            {link.label}
          </Link>
        ))}
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        {props.documents.map((doc) => {
          const currentContent = doc.currentRevision?.contentMd ?? doc.bundledDefault.contentMd;
          return (
            <section
              key={doc.id}
              className="rounded-2xl border border-black/10 bg-white p-6 dark:border-white/15 dark:bg-zinc-950"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                    {doc.localeLabel}
                  </div>
                  <h2 className="mt-1 text-2xl font-semibold">{doc.title}</h2>
                  <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                    {doc.currentRevision ? (
                      <>
                        Published revision {doc.currentRevision.revNumber} · <LocalTime value={doc.currentRevision.createdAt} />
                      </>
                    ) : (
                      <>
                        Using bundled default · <LocalTime value={doc.bundledDefault.createdAt} />
                      </>
                    )}
                  </p>
                </div>

                <Link className="text-sm underline" href={doc.publicHref} target="_blank">
                  Open public page
                </Link>
              </div>

              <label className="mt-6 block text-sm">
                <div className="mb-2 text-xs uppercase tracking-wide text-zinc-500">Markdown</div>
                <textarea
                  className="min-h-72 w-full rounded-xl border border-black/10 bg-white px-4 py-3 font-mono text-sm dark:border-white/15 dark:bg-black"
                  value={drafts[doc.id] ?? ""}
                  onChange={(event) =>
                    setDrafts((prev) => ({ ...prev, [doc.id]: event.target.value }))
                  }
                />
              </label>

              {!doc.currentRevision ? (
                <div className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
                  No published override yet. The editor starts from the bundled default that the public page is already using.
                </div>
              ) : null}

              {errors[doc.id] ? (
                <div className="mt-3 text-sm text-red-600">{errors[doc.id]}</div>
              ) : null}
              {infos[doc.id] ? (
                <div className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">{infos[doc.id]}</div>
              ) : null}

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => save(doc)}
                  disabled={busyId === doc.id}
                  className="rounded-xl bg-black px-4 py-3 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
                >
                  {busyId === doc.id ? "Saving…" : "Save revision"}
                </button>
                <button
                  type="button"
                  onClick={() => resetEditor(doc.id, currentContent)}
                  disabled={busyId === doc.id}
                  className="rounded-xl border border-black/10 bg-white px-4 py-3 text-sm dark:border-white/15 dark:bg-black disabled:opacity-50"
                >
                  {doc.currentRevision ? "Reset to published" : "Reset to bundled default"}
                </button>
              </div>

              <div className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
                Markdown supported. History below keeps the latest 20 revisions for this document and language.
              </div>

              <section className="mt-8">
                <h3 className="text-lg font-medium">History</h3>
                {doc.history.length === 0 ? (
                  <div className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">No revisions yet.</div>
                ) : (
                  <ul className="mt-4 space-y-3">
                    {doc.history.map((revision) => (
                      <li
                        key={revision.id}
                        className="rounded-xl border border-black/10 bg-zinc-50 p-4 text-sm dark:border-white/15 dark:bg-zinc-900"
                      >
                        <details>
                          <summary className="cursor-pointer list-none font-medium">
                            Revision {revision.revNumber} · {revision.createdBy} · <LocalTime value={revision.createdAt} />
                          </summary>
                          <div className="mt-3 flex flex-wrap gap-3">
                            <button
                              type="button"
                              onClick={() => loadRevision(doc.id, revision)}
                              className="rounded-lg border border-black/10 bg-white px-3 py-2 text-xs font-medium dark:border-white/15 dark:bg-black"
                            >
                              Load into editor
                            </button>
                          </div>
                          <pre className="mt-3 overflow-x-auto whitespace-pre-wrap rounded-lg border border-black/10 bg-white p-3 text-xs dark:border-white/15 dark:bg-black">
                            {revision.contentMd}
                          </pre>
                        </details>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </section>
          );
        })}
      </div>
    </main>
  );
}
