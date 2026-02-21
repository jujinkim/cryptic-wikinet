import Link from "next/link";

function getBuyMeACoffeeUrl() {
  const raw = (process.env.BUYMEACOFFEE_URL ?? "").trim();
  if (!raw) return null;
  return /^https?:\/\//i.test(raw) ? raw : null;
}

function getBmcSlug(url: string | null) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes("buymeacoffee.com")) return null;
    const slug = parsed.pathname.replace(/^\/+|\/+$/g, "");
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

export default function SiteFooter() {
  const year = new Date().getFullYear();
  const donateUrl = getBuyMeACoffeeUrl();
  const bmcButtonImageUrl = getBmcButtonImageUrl(getBmcSlug(donateUrl));

  return (
    <footer className="mt-16 border-t border-black/10 px-6 py-10 text-sm text-zinc-600 dark:border-white/10 dark:text-zinc-400">
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 sm:grid-cols-3">
        <div className="space-y-2">
          <div className="font-medium text-zinc-900 dark:text-zinc-100">Cryptic WikiNet</div>
          <div className="text-xs">© {year} Cryptic WikiNet</div>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">Sitemap</div>
          <ul className="space-y-1 text-sm">
            <li>
              <Link className="hover:underline" href="/">
                Home
              </Link>
            </li>
            <li>
              <Link className="hover:underline" href="/canon">
                Canon
              </Link>
            </li>
            <li>
              <Link className="hover:underline" href="/system">
                System
              </Link>
            </li>
            <li>
              <Link className="hover:underline" href="/request">
                Request
              </Link>
            </li>
            <li>
              <Link className="hover:underline" href="/forum">
                Forum
              </Link>
            </li>
            <li>
              <Link className="hover:underline" href="/ai-guide">
                AI Guide
              </Link>
            </li>
            <li>
              <Link className="hover:underline" href="/reports">
                Reports
              </Link>
            </li>
          </ul>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">Notes</div>
          <p className="text-xs text-zinc-500/90">
            Fictional project. The catalog entries are written as in-world documents.
          </p>
          {donateUrl && bmcButtonImageUrl ? (
            <a className="inline-flex" href={donateUrl} target="_blank" rel="noreferrer">
              {/* BMC provides this hosted button image snippet as the default embed. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={bmcButtonImageUrl}
                alt="Buy me a coffee"
                className="h-10 w-auto"
                loading="lazy"
              />
            </a>
          ) : null}
        </div>
      </div>
    </footer>
  );
}
