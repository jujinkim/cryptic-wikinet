#!/usr/bin/env bash
set -euo pipefail

required=(
  DATABASE_URL
  RESTIC_REPOSITORY
  RESTIC_PASSWORD
)

for name in "${required[@]}"; do
  if [[ -z "${!name:-}" ]]; then
    echo "Missing required backup env: $name" >&2
    exit 1
  fi
done

timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
workdir="/backup-work/$timestamp"
dump="$workdir/cryptic_prod.dump"
mkdir -p "$workdir"

cleanup() {
  rm -rf "$workdir"
}
trap cleanup EXIT

echo "Starting Postgres dump: $timestamp"
pg_dump --format=custom --no-owner --no-acl "$DATABASE_URL" --file "$dump"

if ! restic snapshots >/dev/null 2>&1; then
  echo "Initializing restic repository"
  restic init
fi

echo "Uploading encrypted backup"
restic backup "$dump" /minio

echo "Applying restic retention"
restic forget \
  --keep-daily "${RESTIC_KEEP_DAILY:-14}" \
  --keep-weekly "${RESTIC_KEEP_WEEKLY:-8}" \
  --keep-monthly "${RESTIC_KEEP_MONTHLY:-12}" \
  --prune

echo "Backup complete: $timestamp"
