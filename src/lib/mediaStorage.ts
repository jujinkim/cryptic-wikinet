import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { del, put } from "@vercel/blob";

type MediaStorageDriver = "vercel_blob" | "s3" | "disabled";

type PutMediaObjectArgs = {
  pathname: string;
  body: Buffer;
  contentType: string;
  cacheControl?: string;
};

type PutMediaObjectResult = {
  url: string;
  path: string;
};

let s3Client: S3Client | null = null;

function env(name: string) {
  return (process.env[name] ?? "").trim();
}

function envBool(name: string, fallback = false) {
  const value = env(name).toLowerCase();
  if (!value) return fallback;
  return value === "1" || value === "true" || value === "yes";
}

export function getMediaStorageDriver(): MediaStorageDriver {
  const configured = env("MEDIA_STORAGE_DRIVER").toLowerCase();
  if (configured === "vercel_blob" || configured === "vercel-blob") return "vercel_blob";
  if (configured === "s3") return "s3";
  if (configured === "disabled" || configured === "none") return "disabled";

  if (env("BLOB_READ_WRITE_TOKEN")) return "vercel_blob";
  if (env("S3_BUCKET") && env("S3_ACCESS_KEY_ID") && env("S3_SECRET_ACCESS_KEY")) return "s3";
  return "disabled";
}

function getS3Config() {
  const bucket = env("S3_BUCKET");
  const accessKeyId = env("S3_ACCESS_KEY_ID");
  const secretAccessKey = env("S3_SECRET_ACCESS_KEY");
  const endpoint = env("S3_ENDPOINT") || undefined;
  const region = env("S3_REGION") || "us-east-1";
  const publicBaseUrl = env("S3_PUBLIC_BASE_URL").replace(/\/+$/, "");

  return {
    bucket,
    accessKeyId,
    secretAccessKey,
    endpoint,
    region,
    publicBaseUrl,
    forcePathStyle: envBool("S3_FORCE_PATH_STYLE", !!endpoint),
  };
}

function getS3Client() {
  if (s3Client) return s3Client;
  const config = getS3Config();
  s3Client = new S3Client({
    endpoint: config.endpoint,
    region: config.region,
    forcePathStyle: config.forcePathStyle,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });
  return s3Client;
}

function encodePath(pathname: string) {
  return pathname
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
}

function publicS3Url(publicBaseUrl: string, pathname: string) {
  return `${publicBaseUrl}/${encodePath(pathname.replace(/^\/+/, ""))}`;
}

function normalizeS3Key(ref: string, publicBaseUrl: string) {
  const raw = ref.trim();
  if (!raw) return raw;

  try {
    const url = new URL(raw);
    const publicBase = publicBaseUrl ? new URL(publicBaseUrl) : null;
    if (
      publicBase &&
      url.origin === publicBase.origin &&
      url.pathname.startsWith(publicBase.pathname.replace(/\/+$/, "") + "/")
    ) {
      return decodeURIComponent(
        url.pathname.slice(publicBase.pathname.replace(/\/+$/, "").length + 1),
      );
    }

    const mediaMarker = "/media/";
    const mediaIndex = url.pathname.indexOf(mediaMarker);
    if (mediaIndex >= 0) {
      return decodeURIComponent(url.pathname.slice(mediaIndex + mediaMarker.length));
    }
    return decodeURIComponent(url.pathname.replace(/^\/+/, ""));
  } catch {
    return raw.replace(/^\/+/, "");
  }
}

export function getMediaStorageStatus() {
  const driver = getMediaStorageDriver();
  if (driver === "vercel_blob") {
    return { driver, configured: !!env("BLOB_READ_WRITE_TOKEN") };
  }
  if (driver === "s3") {
    const config = getS3Config();
    return {
      driver,
      configured: !!(
        config.bucket &&
        config.accessKeyId &&
        config.secretAccessKey &&
        config.publicBaseUrl
      ),
    };
  }
  return { driver, configured: false };
}

export function isMediaStorageConfigured() {
  return getMediaStorageStatus().configured;
}

export async function putMediaObject(args: PutMediaObjectArgs): Promise<PutMediaObjectResult> {
  const driver = getMediaStorageDriver();

  if (driver === "vercel_blob") {
    if (!env("BLOB_READ_WRITE_TOKEN")) {
      throw new Error("Vercel Blob storage is not configured");
    }
    const blob = await put(args.pathname, args.body, {
      access: "public",
      addRandomSuffix: false,
      contentType: args.contentType,
    });
    return { url: blob.url, path: blob.pathname };
  }

  if (driver === "s3") {
    const config = getS3Config();
    if (!getMediaStorageStatus().configured) {
      throw new Error("S3 media storage is not configured");
    }
    await getS3Client().send(
      new PutObjectCommand({
        Bucket: config.bucket,
        Key: args.pathname,
        Body: args.body,
        ContentType: args.contentType,
        CacheControl: args.cacheControl ?? "public, max-age=31536000, immutable",
      }),
    );
    return {
      url: publicS3Url(config.publicBaseUrl, args.pathname),
      path: args.pathname,
    };
  }

  throw new Error("Media storage is disabled");
}

export async function deleteMediaObject(ref: string) {
  const driver = getMediaStorageDriver();

  if (driver === "vercel_blob") {
    if (!env("BLOB_READ_WRITE_TOKEN")) {
      throw new Error("Vercel Blob storage is not configured");
    }
    await del(ref);
    return;
  }

  if (driver === "s3") {
    const config = getS3Config();
    if (!getMediaStorageStatus().configured) {
      throw new Error("S3 media storage is not configured");
    }
    const key = normalizeS3Key(ref, config.publicBaseUrl);
    if (!key) return;
    await getS3Client().send(
      new DeleteObjectCommand({
        Bucket: config.bucket,
        Key: key,
      }),
    );
    return;
  }

  throw new Error("Media storage is disabled");
}
