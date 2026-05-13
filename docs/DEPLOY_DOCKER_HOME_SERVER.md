# Deploy to a Home Docker Server

This document prepares Cryptic WikiNet to move from Vercel + Supabase to this PC.

Target shape:
- Production and staging run in Docker on the same host.
- Production is served as `https://www.crypticwiki.net`; `crypticwiki.net` redirects to `www`.
- Staging runs in production mode but uses its own empty DB and is LAN-only.
- Postgres and MinIO data live under `/srv/cryptic-wikinet` on a dedicated disk.
- `ai-client` stays in its own project and is not part of this compose stack.

## Services

`docker-compose.selfhost.yml` defines:
- `postgres`: Postgres 17 with `cryptic_prod` and `cryptic_staging` databases.
- `minio` and `minio-init`: S3-compatible media storage and bucket initialization.
- `web-prod`: Next.js production app, migrations on startup, production DB.
- `web-staging`: Next.js production-mode app, migrations on startup, staging DB.
- `caddy`: public production reverse proxy plus LAN staging proxy and `/media/*`.
- `article-retention-cron`: replaces Vercel Cron for production retention sweeps.
- `backup`: encrypted restic backups to Cloudflare R2.

## One-Time Host Setup

Install Docker and Compose first. This host already has Docker, but keep the target checks explicit:

```bash
docker --version
docker compose version
```

Prepare a dedicated data root. Do not use the current root filesystem unless it has been expanded; at planning time it had only about 14GB free.

```bash
sudo mkdir -p /srv/cryptic-wikinet
sudo chmod 750 /srv/cryptic-wikinet
```

If the directory is on a separate mounted disk, add it to `/etc/fstab` before running production.

## Environment Files

Create real env files from the tracked examples:

```bash
cp ops/docker/env/selfhost.env.example ops/docker/env/selfhost.env
cp ops/docker/env/prod.env.example ops/docker/env/prod.env
cp ops/docker/env/staging.env.example ops/docker/env/staging.env
cp ops/docker/env/backup.env.example ops/docker/env/backup.env
```

Generate secrets:

```bash
openssl rand -base64 48
openssl rand -base64 32
```

Important values:
- `selfhost.env`: stack-level paths, domains, Postgres password, MinIO keys, staging bind IP.
- `prod.env`: `DATABASE_URL`, `NEXTAUTH_URL=https://www.crypticwiki.net`, `NEXTAUTH_SECRET`, SMTP, `CRON_SECRET`.
- `staging.env`: `DATABASE_URL` for `cryptic_staging`, `NEXTAUTH_URL=http://192.168.1.111:3001`, separate `NEXTAUTH_SECRET`.
- `backup.env`: production `DATABASE_URL`, R2 `RESTIC_REPOSITORY`, `RESTIC_PASSWORD`, R2 S3 API credentials.

Use URL-safe Postgres passwords or URL-encode them inside `DATABASE_URL`.

## Build And Start

Validate the compose file:

```bash
docker compose --env-file ops/docker/env/selfhost.env -f docker-compose.selfhost.yml config
```

Build and start the stack:

```bash
docker compose --env-file ops/docker/env/selfhost.env -f docker-compose.selfhost.yml up -d --build
```

Check health:

```bash
curl -fsS http://192.168.1.111:3001/api/health
docker compose --env-file ops/docker/env/selfhost.env -f docker-compose.selfhost.yml ps
docker compose --env-file ops/docker/env/selfhost.env -f docker-compose.selfhost.yml logs -f web-prod
```

MinIO console is bound to localhost by default:

```bash
ssh -L 9001:127.0.0.1:9001 <server>
open http://127.0.0.1:9001
```

## Supabase Production Data Migration

Keep Supabase and Vercel live during rehearsal. Run migration into the Docker production DB before DNS cutover.

1. Apply schema on Docker DB by starting `web-prod` once. It runs `prisma migrate deploy`.
2. Dump only Prisma app data from Supabase:

```bash
pg_dump "$SUPABASE_DATABASE_URL" \
  --format=custom \
  --data-only \
  --schema=public \
  --exclude-table=public._prisma_migrations \
  --no-owner \
  --no-acl \
  --file cryptic-public-data.dump
```

3. Restore into the self-host production DB:

```bash
cat cryptic-public-data.dump | docker compose \
  --env-file ops/docker/env/selfhost.env \
  -f docker-compose.selfhost.yml \
  exec -T postgres pg_restore \
  --dbname "postgresql://cryptic:<password>@127.0.0.1:5432/cryptic_prod?schema=public" \
  --no-owner \
  --no-acl
```

The compose file does not expose Postgres on the host by default.

4. Compare row counts:

```sql
select schemaname, relname, n_live_tup::bigint
from pg_stat_user_tables
where schemaname = 'public'
order by relname;
```

5. Verify:
- `/api/health`
- `/`
- `/catalog`
- `/forum`
- `/wiki/<known-slug>`
- `/login`
- `/api/ai/meta`

Current Supabase facts at planning time:
- DB size was about 14MB.
- Public app tables were in `public`.
- Article cover images in DB were `0`, so no Vercel Blob object migration was required.

## Cutover Gate

Do not switch DNS until:
- `npm run lint` and `npm run build` pass locally.
- Docker `web-prod`, `web-staging`, `caddy`, `postgres`, `minio`, and `backup` are healthy.
- R2 backup has produced at least one successful snapshot.
- A restore drill has been completed into a throwaway DB or temporary host.
- SMTP works in production mode.
- `NEXTAUTH_URL` and Google OAuth redirect URIs match `https://www.crypticwiki.net`.

Public ingress is intentionally left as a final gate. Choose one:
- Router port-forwarding 80/443 to this PC, then Caddy obtains ACME certificates.
- Cloudflare Tunnel, with Caddy kept as the internal reverse proxy.

Until that gate, keep `PUBLIC_HTTP_BIND_IP` and `PUBLIC_HTTPS_BIND_IP` at `127.0.0.1`.
For router port-forwarding cutover, change them to `0.0.0.0` and point DNS at this server.

Keep the Vercel deployment available as rollback until the new server has run cleanly for several days.

## Common Operations

Restart one service:

```bash
docker compose --env-file ops/docker/env/selfhost.env -f docker-compose.selfhost.yml restart web-prod
```

Run migrations manually:

```bash
docker compose --env-file ops/docker/env/selfhost.env -f docker-compose.selfhost.yml exec web-prod npx prisma migrate deploy
```

Run a backup immediately:

```bash
docker compose --env-file ops/docker/env/selfhost.env -f docker-compose.selfhost.yml exec backup /usr/local/bin/run-backup.sh
```

Inspect restic snapshots:

```bash
docker compose --env-file ops/docker/env/selfhost.env -f docker-compose.selfhost.yml exec backup restic snapshots
```
