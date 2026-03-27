const DISALLOWED_SLUG_RE = /^(assigned|request|queue)(?:-|$)/i;
const HEXISH_SLUG_TOKEN_RE = /^[a-f0-9]{6,}$/i;

const DISALLOWED_CONTENT_PATTERNS: Array<{ message: string; regex: RegExp }> = [
  {
    message: "Do not mention request queue plumbing inside the article body",
    regex: /\brequest queue item\b/i,
  },
  {
    message: "Do not describe the article as an initial field-catalog compilation",
    regex: /\binitial field-catalog compilation\b/i,
  },
  {
    message: "Do not describe the request keywords themselves as the observed unit",
    regex: /\brequest keywords? (?:themselves?|itself) (?:became|becomes?|are|is)\b/i,
  },
  {
    message: "Do not use queue or request-id wording inside the article body",
    regex: /\b(?:requestId|queue item|queued request)\b/i,
  },
  {
    message: "Do not explain the article as a response to a queue request inside the article body",
    regex: /\btriggered this (?:initial )?(?:field-)?catalog compilation\b/i,
  },
];

function countOccurrences(haystack: string, needle: string) {
  if (!needle) return 0;
  let count = 0;
  let idx = 0;
  while (true) {
    idx = haystack.indexOf(needle, idx);
    if (idx === -1) return count;
    count += 1;
    idx += needle.length;
  }
}

function normalizeLooseText(input: string) {
  return input
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

export function validateCatalogSlugQuality(slugRaw: string) {
  const slug = String(slugRaw ?? "").trim().toLowerCase();
  const issues: string[] = [];

  if (!slug) return { ok: true as const, issues };

  const tokens = slug.split("-").filter(Boolean);

  if (DISALLOWED_SLUG_RE.test(slug)) {
    issues.push("slug must describe the fictional subject, not request plumbing");
  }
  if (tokens.some((token) => HEXISH_SLUG_TOKEN_RE.test(token))) {
    issues.push("slug must not contain uuid-like or machine-generated hex fragments");
  }
  if (slug.length > 80) {
    issues.push("slug is too long; prefer a shorter memorable slug");
  }

  return { ok: issues.length === 0, issues };
}

export function validateCatalogBodyQuality(args: { title: string; contentMd: string }) {
  const title = String(args.title ?? "").trim();
  const contentMd = String(args.contentMd ?? "");
  const issues: string[] = [];

  for (const pattern of DISALLOWED_CONTENT_PATTERNS) {
    if (pattern.regex.test(contentMd)) {
      issues.push(pattern.message);
    }
  }

  const exactTitleCount =
    title.length >= 8 ? countOccurrences(contentMd.toLowerCase(), title.toLowerCase()) : 0;
  if (exactTitleCount > 4) {
    issues.push("title phrase is repeated too many times; add new concrete details instead of reusing the title");
  }

  const looseTitle = normalizeLooseText(title);
  const looseBody = normalizeLooseText(contentMd);
  if (looseTitle.length >= 12) {
    const looseCount = countOccurrences(looseBody, looseTitle);
    if (looseCount > 4) {
      issues.push("same core phrase repeats across sections too often; vary the prose and add specific evidence");
    }
  }

  return { ok: issues.length === 0, issues };
}
