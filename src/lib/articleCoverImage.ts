import crypto from "crypto";
import { del, put } from "@vercel/blob";
import { envInt } from "@/lib/config";

const RIFF_HEADER = "RIFF";
const WEBP_HEADER = "WEBP";
const CHUNK_HEADER_BYTES = 8;

export class ArticleCoverImageError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export function articleCoverMaxBytes() {
  return Math.max(1024, envInt("ARTICLE_COVER_MAX_BYTES", 50 * 1024));
}

export function articleCoverMaxDimension() {
  return Math.max(1, envInt("ARTICLE_COVER_MAX_DIMENSION", 1024));
}

export function isArticleCoverStorageConfigured() {
  return !!(process.env.BLOB_READ_WRITE_TOKEN ?? "").trim();
}

function normalizeBase64(input: string) {
  let value = input.trim();
  if (!value) {
    throw new ArticleCoverImageError("coverImageWebpBase64 is empty");
  }

  if (value.startsWith("data:")) {
    const comma = value.indexOf(",");
    if (comma < 0) {
      throw new ArticleCoverImageError("cover image data URL is invalid");
    }
    const header = value.slice(0, comma).toLowerCase();
    if (!header.includes("image/webp") || !header.endsWith(";base64")) {
      throw new ArticleCoverImageError("cover image data URL must be base64-encoded image/webp");
    }
    value = value.slice(comma + 1);
  }

  return value.replace(/\s+/g, "");
}

function decodeBase64(base64: string) {
  try {
    return Buffer.from(base64, "base64");
  } catch {
    throw new ArticleCoverImageError("cover image base64 is invalid");
  }
}

function parseVp8Dimensions(chunk: Buffer) {
  if (chunk.length < 10) {
    throw new ArticleCoverImageError("cover image VP8 chunk is truncated");
  }
  return {
    width: chunk.readUInt16LE(6) & 0x3fff,
    height: chunk.readUInt16LE(8) & 0x3fff,
  };
}

function parseVp8lDimensions(chunk: Buffer) {
  if (chunk.length < 5) {
    throw new ArticleCoverImageError("cover image VP8L chunk is truncated");
  }
  if (chunk[0] !== 0x2f) {
    throw new ArticleCoverImageError("cover image VP8L chunk is invalid");
  }

  const bits =
    chunk[1]! |
    (chunk[2]! << 8) |
    (chunk[3]! << 16) |
    (chunk[4]! << 24);

  return {
    width: 1 + (bits & 0x3fff),
    height: 1 + ((bits >> 14) & 0x3fff),
  };
}

function parseVp8xDimensions(chunk: Buffer) {
  if (chunk.length < 10) {
    throw new ArticleCoverImageError("cover image VP8X chunk is truncated");
  }

  return {
    width: 1 + chunk[4]! + (chunk[5]! << 8) + (chunk[6]! << 16),
    height: 1 + chunk[7]! + (chunk[8]! << 8) + (chunk[9]! << 16),
  };
}

function inspectWebp(buffer: Buffer) {
  if (buffer.length < 16) {
    throw new ArticleCoverImageError("cover image is too small to be a valid WebP");
  }
  if (buffer.toString("ascii", 0, 4) !== RIFF_HEADER || buffer.toString("ascii", 8, 12) !== WEBP_HEADER) {
    throw new ArticleCoverImageError("cover image must be a valid WebP file");
  }

  let offset = 12;
  let width: number | null = null;
  let height: number | null = null;
  let hasAnimation = false;
  let hasMetadata = false;

  while (offset + CHUNK_HEADER_BYTES <= buffer.length) {
    const fourCC = buffer.toString("ascii", offset, offset + 4);
    const chunkSize = buffer.readUInt32LE(offset + 4);
    const chunkStart = offset + CHUNK_HEADER_BYTES;
    const chunkEnd = chunkStart + chunkSize;
    if (chunkEnd > buffer.length) {
      throw new ArticleCoverImageError("cover image has an invalid WebP chunk");
    }

    const chunk = buffer.subarray(chunkStart, chunkEnd);
    if (fourCC === "VP8X") {
      const flags = chunk[0] ?? 0;
      if (flags & 0x02) hasAnimation = true;
      if (flags & 0x2c) hasMetadata = true;
      const dims = parseVp8xDimensions(chunk);
      width = dims.width;
      height = dims.height;
    } else if (fourCC === "VP8 " && (width == null || height == null)) {
      const dims = parseVp8Dimensions(chunk);
      width = dims.width;
      height = dims.height;
    } else if (fourCC === "VP8L" && (width == null || height == null)) {
      const dims = parseVp8lDimensions(chunk);
      width = dims.width;
      height = dims.height;
    } else if (fourCC === "ANIM") {
      hasAnimation = true;
    } else if (fourCC === "EXIF" || fourCC === "XMP " || fourCC === "ICCP") {
      hasMetadata = true;
    }

    offset = chunkEnd + (chunkSize % 2);
  }

  if (!width || !height) {
    throw new ArticleCoverImageError("cover image dimensions could not be read");
  }

  return { width, height, hasAnimation, hasMetadata };
}

export async function uploadArticleCoverImage(args: {
  slug: string;
  coverImageWebpBase64: string;
}) {
  if (!isArticleCoverStorageConfigured()) {
    throw new ArticleCoverImageError("cover image storage is not configured", 503);
  }

  const normalized = normalizeBase64(args.coverImageWebpBase64);
  const bytes = decodeBase64(normalized);
  if (!bytes.length) {
    throw new ArticleCoverImageError("cover image base64 decoded to an empty payload");
  }
  if (bytes.length > articleCoverMaxBytes()) {
    throw new ArticleCoverImageError(
      `cover image exceeds ${articleCoverMaxBytes()} bytes`,
    );
  }

  const info = inspectWebp(bytes);
  if (info.hasAnimation) {
    throw new ArticleCoverImageError("animated WebP cover images are not allowed");
  }
  if (info.hasMetadata) {
    throw new ArticleCoverImageError("cover image metadata chunks are not allowed");
  }
  if (info.width > articleCoverMaxDimension() || info.height > articleCoverMaxDimension()) {
    throw new ArticleCoverImageError(
      `cover image dimensions must be at most ${articleCoverMaxDimension()}px`,
    );
  }

  const digest = crypto.createHash("sha256").update(bytes).digest("hex").slice(0, 24);
  const pathname = `article-covers/${args.slug}/${digest}.webp`;
  const blob = await put(pathname, bytes, {
    access: "public",
    addRandomSuffix: false,
    contentType: "image/webp",
  });

  return {
    url: blob.url,
    path: blob.pathname,
    width: info.width,
    height: info.height,
    byteSize: bytes.length,
  };
}

export async function deleteArticleCoverImage(urlOrPathname: string | null | undefined) {
  if (!urlOrPathname) return;
  if (!isArticleCoverStorageConfigured()) {
    throw new ArticleCoverImageError("cover image storage is not configured", 503);
  }
  await del(urlOrPathname);
}
