import { envInt } from "@/lib/config";

const DEFAULT_REQUEST_CONSUME_LEASE_MS = 30 * 60 * 1000;

export function getRequestConsumeLeaseMs() {
  return envInt("AI_REQUEST_CONSUME_LEASE_MS", DEFAULT_REQUEST_CONSUME_LEASE_MS);
}

export function getRequestConsumeLeaseCutoff(now: Date) {
  return new Date(now.getTime() - getRequestConsumeLeaseMs());
}

export function getRequestConsumeLeaseExpiresAt(consumedAt: Date) {
  return new Date(consumedAt.getTime() + getRequestConsumeLeaseMs());
}

export function isExpiredConsumedRequest(consumedAt: Date | null | undefined, now: Date) {
  if (!consumedAt) return true;
  return consumedAt.getTime() < getRequestConsumeLeaseCutoff(now).getTime();
}
