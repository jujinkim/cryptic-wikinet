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
  slug: string;
  title: string;
  publicHref: string;
  currentRevision: {
    contentMd: string;
    createdAt: string;
    revNumber: number;
  } | null;
  history: HistoryItem[];
};

export default function LegalAdminClient(props: {
  adminLinks: { href: string; label: string }[];
  documents: LegalDocumentAdminItem[];
}) {
  const [drafts, setDrafts] = useState<Record<string, string>>(
    Object.fromEntries(
      props.documents.map((doc) => [doc.slug, doc.currentRevision?.contentMd ?? ""]),
    ),
  );
  const [busySlug, setBusySlug] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [infos, setInfos] = useState<Record<string, string | null>>({});

  function setError(slug: string, message: string | null) {
    setErrors((prev) => ({ ...prev, [slug]: message }));
  }

  function setInfo(slug: string, message: string | null) {
    setInfos((prev) => ({ ...prev, [slug]: message }));
  }

  function resetEditor(slug: string, contentMd: string) {
    setDrafts((prev) => ({ ...prev, [slug]: contentMd }));
    setError(slug, null);
    setInfo(slug, null);
  }

  function loadRevision(slug: string, revision: HistoryItem) {
    setDrafts((prev) => ({ ...prev, [slug]: revision.contentMd }));
    setError(slug, null);
    setInfo(slug, `Loaded revision ${revision.revNumber} into the editor. Save to publish it as the current version.`);
  }

  async function save(slug: string) {
    const contentMd = drafts[slug] ?? "";
    if (!contentMd.trim()) {
      setError(slug, "Content is required.");
      setInfo(slug, null);
      return;
    }

    setBusySlug(slug);
    setError(slug, null);
    setInfo(slug, null);
    try {
      const res = await fetch("/api/legal-docs/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, contentMd }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(slug, String(data.error ?? "Save failed."));
        return;
      }
      if (data.unchanged) {
        setInfo(slug, "No changes detected. Current revision left unchanged.");
        return;
      }
      window.location.reload();
    } catch (error) {
      setError(slug, String(error));
    } finally {
      setBusySlug(null);
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <h1 className="text-3xl font-semibold">Legal documents</h1>
      <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
        Manage the public privacy policy and terms pages. No default content is seeded. Saving creates a new revision only when the content changes.
      </p>

      <div className="mt-5 flex flex-wrap gap-3 text-sm">
        {props.adminLinks.map((link) => (
          <Link key={link.href} className="underline" href={link.href}>
            {link.label}
          </Link>
        ))}
      </div>

      {props.documents.map((doc) => {
        const currentContent = doc.currentRevision?.contentMd ?? "";
        return (
          <section
            key={doc.slug}
            className="mt-10 rounded-2xl border border-black/10 bg-white p-6 dark:border-white/15 dark:bg-zinc-950"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold">{doc.title}</h2>
                <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                  {doc.currentRevision ? (
                    <>
                      Published revision {doc.currentRevision.revNumber} · <LocalTime value={doc.currentRevision.createdAt} />
                    </>
                  ) : (
                    "Not published yet."
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
                value={drafts[doc.slug] ?? ""}
                onChange={(event) =>
                  setDrafts((prev) => ({ ...prev, [doc.slug]: event.target.value }))
                }
              />
            </label>

            {errors[doc.slug] ? (
              <div className="mt-3 text-sm text-red-600">{errors[doc.slug]}</div>
            ) : null}
            {infos[doc.slug] ? (
              <div className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">{infos[doc.slug]}</div>
            ) : null}

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => save(doc.slug)}
                disabled={busySlug === doc.slug}
                className="rounded-xl bg-black px-4 py-3 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
              >
                {busySlug === doc.slug ? "Saving…" : "Save revision"}
              </button>
              <button
                type="button"
                onClick={() => resetEditor(doc.slug, currentContent)}
                disabled={busySlug === doc.slug}
                className="rounded-xl border border-black/10 bg-white px-4 py-3 text-sm dark:border-white/15 dark:bg-black disabled:opacity-50"
              >
                {doc.currentRevision ? "Reset to published" : "Clear editor"}
              </button>
            </div>

            <div className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
              Markdown supported. History below keeps the latest 20 revisions for this document.
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
                            onClick={() => loadRevision(doc.slug, revision)}
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
    </main>
  );
}
