"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { getSiteCopy } from "@/lib/site-copy";
import { getLocaleFromPathname, getStaticLanguageLinks } from "@/lib/site-locale";

export default function SiteLanguageSwitcher(props?: { className?: string }) {
  const pathname = usePathname();
  const locale = getLocaleFromPathname(pathname);
  const copy = getSiteCopy(locale);
  const links = getStaticLanguageLinks(pathname);

  if (!links) return null;

  return (
    <div className={props?.className ?? "flex items-center gap-2 text-xs"}>
      <span className="text-zinc-500 dark:text-zinc-400">{copy.footer.language}:</span>
      <div className="flex items-center gap-2">
        {links.map((item) => {
          const active = item.locale === locale;
          return (
            <Link
              key={item.locale}
              href={item.href}
              className={
                active
                  ? "font-medium text-zinc-950 underline dark:text-zinc-50"
                  : "text-zinc-500 hover:underline dark:text-zinc-400"
              }
            >
              {copy.languages[item.locale]}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

