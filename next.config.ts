import type { NextConfig } from "next";

function uniq(xs: string[]) {
  return Array.from(new Set(xs.filter(Boolean)));
}

function parseList(s: string | undefined) {
  return (s ?? "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}

function toHostname(input: string): string {
  // Accept either full origin/url (http://x:3000) or hostname (x) or host:port (x:3000)
  if (input.includes("://")) {
    try {
      return new URL(input).hostname;
    } catch {
      return input;
    }
  }
  // Strip port if present
  return input.replace(/:\d+$/, "");
}

function tryHostnameFromUrl(s: string | undefined) {
  if (!s) return null;
  try {
    return new URL(s).hostname;
  } catch {
    return null;
  }
}

// Next.js checks hostnames (not full origins) for allowedDevOrigins.
const defaultAllowedDevOrigins = uniq([
  // LAN (current known dev IP)
  "192.168.1.112",
  // Whatever NEXTAUTH_URL is set to (usually your primary dev hostname)
  tryHostnameFromUrl(process.env.NEXTAUTH_URL) ?? "",
]);

const allowedDevOrigins = uniq([
  ...defaultAllowedDevOrigins,
  ...parseList(process.env.ALLOWED_DEV_ORIGINS).map(toHostname),
]);

const nextConfig: NextConfig = {
  // Needed for LAN/IP dev access: prevents Next dev from warning/denying cross-origin /_next/*
  allowedDevOrigins,
};

export default nextConfig;
