import type { NextConfig } from "next";

function uniq(xs: string[]) {
  return Array.from(new Set(xs.filter(Boolean)));
}

function parseOrigins(s: string | undefined) {
  return (s ?? "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

function tryOriginFromUrl(s: string | undefined) {
  if (!s) return null;
  try {
    return new URL(s).origin;
  } catch {
    return null;
  }
}

const defaultAllowedDevOrigins = uniq([
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  // LAN (current known dev IP)
  "http://192.168.1.112:3000",
  // Whatever NEXTAUTH_URL is set to (usually your primary dev origin)
  tryOriginFromUrl(process.env.NEXTAUTH_URL) ?? "",
]);

const allowedDevOrigins = uniq([
  ...defaultAllowedDevOrigins,
  ...parseOrigins(process.env.ALLOWED_DEV_ORIGINS),
]);

const nextConfig: NextConfig = {
  // Needed for LAN/IP dev access: prevents Next dev from warning/denying cross-origin /_next/*
  allowedDevOrigins,
};

export default nextConfig;
