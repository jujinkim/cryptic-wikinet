import SiteFooterClient from "@/app/site-footer-client";

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
    <SiteFooterClient
      year={year}
      donateUrl={donateUrl}
      bmcButtonImageUrl={bmcButtonImageUrl}
    />
  );
}
