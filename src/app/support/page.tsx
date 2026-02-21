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

function getBmcSlug(donateUrl: string | null) {
  if (!donateUrl) return null;
  try {
    const u = new URL(donateUrl);
    if (!u.hostname.includes("buymeacoffee.com")) return null;
    const slug = u.pathname.replace(/^\/+|\/+$/g, "");
    if (!slug) return null;
    return /^[A-Za-z0-9_-]+$/.test(slug) ? slug : null;
  } catch {
    return null;
  }
}

function getBmcButtonImageUrl(slug: string | null) {
  if (!slug) return null;
  const sp = new URLSearchParams({
    text: "Buy me a coffee",
    emoji: "",
    slug,
    button_colour: "FFDD00",
    font_colour: "000000",
    font_family: "Cookie",
    outline_colour: "000000",
    coffee_colour: "ffffff",
  });
  return `https://img.buymeacoffee.com/button-api/?${sp.toString()}`;
}

export default function SupportPage() {
  const donateUrl = getDonateUrl();
  const sponsorEmail = getSponsorEmail();
  const bmcSlug = getBmcSlug(donateUrl);
  const bmcButtonImageUrl = getBmcButtonImageUrl(bmcSlug);
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
          {donateUrl && bmcButtonImageUrl ? (
            <a
              className="mt-4 inline-flex"
              href={donateUrl}
              target="_blank"
              rel="noreferrer"
            >
              {/* BMC provides this hosted button image snippet as the default embed. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={bmcButtonImageUrl}
                alt="Buy me a coffee"
                className="h-12 w-auto"
                loading="lazy"
              />
            </a>
          ) : donateUrl ? (
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
