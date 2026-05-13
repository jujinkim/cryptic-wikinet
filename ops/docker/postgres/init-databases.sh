#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${POSTGRES_MULTIPLE_DATABASES:-}" ]]; then
  exit 0
fi

IFS=',' read -ra databases <<< "$POSTGRES_MULTIPLE_DATABASES"

for db in "${databases[@]}"; do
  db="$(echo "$db" | xargs)"
  if [[ -z "$db" ]]; then
    continue
  fi

  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    SELECT 'CREATE DATABASE "$db"'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$db')\gexec
EOSQL
done
