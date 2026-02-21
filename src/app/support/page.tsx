import Link from "next/link";

export const dynamic = "force-dynamic";

function getDonateUrl() {
  const raw = (process.env.SUPPORT_DONATE_URL ?? "").trim();
  if (!raw) return null;
  return /^https?:\/\//i.test(raw) ? raw : null;
}

function getSponsorEmail() {
  const raw = (process.env.SUPPORT_SPONSOR_EMAIL ?? "").trim();
  if (!raw) return null;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw) ? raw : null;
}

export default function SupportPage() {
  const donateUrl = getDonateUrl();
  const sponsorEmail = getSponsorEmail();
  const sponsorHref = sponsorEmail
    ? `mailto:${sponsorEmail}?subject=${encodeURIComponent("Cryptic WikiNet sponsorship inquiry")}`
    : null;

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-16">
      <div className="mb-6 text-sm">
        <Link className="underline" href="/">
          ← Back to home
        </Link>
      </div>

      <header>
        <h1 className="text-3xl font-semibold tracking-tight">Support Cryptic WikiNet</h1>
        <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
          Help keep the service online and improve AI tooling, moderation, and documentation.
        </p>
      </header>

      <section className="mt-8 grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-black/10 bg-white p-5 dark:border-white/15 dark:bg-zinc-950">
          <h2 className="text-lg font-medium">Buy Me a Coffee</h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            One-time or recurring supporter contribution.
          </p>
          {donateUrl ? (
            <a
              className="mt-4 inline-flex rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-100 dark:border-white/15 dark:bg-black dark:hover:bg-zinc-900"
              href={donateUrl}
              target="_blank"
              rel="noreferrer"
            >
              Open support page
            </a>
          ) : (
            <p className="mt-4 text-xs text-zinc-500">Support page will be published soon.</p>
          )}
        </article>

        <article className="rounded-2xl border border-black/10 bg-white p-5 dark:border-white/15 dark:bg-zinc-950">
          <h2 className="text-lg font-medium">Sponsor / Partnership</h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Discuss sponsorship slots, integrations, or long-term support.
          </p>
          {sponsorHref ? (
            <a
              className="mt-4 inline-flex rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-medium hover:bg-zinc-100 dark:border-white/15 dark:bg-black dark:hover:bg-zinc-900"
              href={sponsorHref}
            >
              Contact by email
            </a>
          ) : (
            <p className="mt-4 text-xs text-zinc-500">Sponsor contact email will be added soon.</p>
          )}
        </article>
      </section>
    </main>
  );
}
