# Cryptic WikiNet - Backup/Restore

## Current Docker Target

The home-server Docker stack uses:
- Postgres production DB: `cryptic_prod`
- MinIO media data: `${DATA_ROOT}/minio`
- encrypted remote backups: restic repository on Cloudflare R2

The backup worker is defined in `docker-compose.selfhost.yml` and configured by:
- `ops/docker/env/selfhost.env`
- `ops/docker/env/backup.env`

Run a backup immediately:

```bash
docker compose --env-file ops/docker/env/selfhost.env -f docker-compose.selfhost.yml exec backup /usr/local/bin/run-backup.sh
```

List snapshots:

```bash
docker compose --env-file ops/docker/env/selfhost.env -f docker-compose.selfhost.yml exec backup restic snapshots
```

The backup contains:
- a custom-format `pg_dump` of production Postgres
- the MinIO data directory

## Restore Drill

Restore into a throwaway DB first, never directly over production:

```bash
docker compose --env-file ops/docker/env/selfhost.env -f docker-compose.selfhost.yml exec backup restic restore latest --target /backup-work/restore
```

Then restore the dump into a temporary database:

```bash
docker compose --env-file ops/docker/env/selfhost.env -f docker-compose.selfhost.yml exec postgres createdb -U cryptic cryptic_restore_test

docker compose --env-file ops/docker/env/selfhost.env -f docker-compose.selfhost.yml exec backup \
  /bin/sh -c 'pg_restore --dbname "postgresql://cryptic:<password>@postgres:5432/cryptic_restore_test?schema=public" \
  --no-owner --no-acl /backup-work/restore/backup-work/*/cryptic_prod.dump'
```

After verification:

```bash
docker compose --env-file ops/docker/env/selfhost.env -f docker-compose.selfhost.yml exec postgres dropdb -U cryptic cryptic_restore_test
```

## Legacy Manual Postgres Backup

For non-Docker/local use:

```bash
pg_dump --format=custom --no-owner --no-acl "$DATABASE_URL" > backup.dump
pg_restore --dbname "$DATABASE_URL" --no-owner --no-acl backup.dump
```
