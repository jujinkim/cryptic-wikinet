# Supabase to Netlify Database Cutover

Goal: move production Postgres from Supabase to Netlify Database without an accidental traffic switch or untested data import.

This repository remains Prisma-first. `prisma/schema.prisma` and `prisma/migrations/` stay schema source of truth. Do not create a second migration history under `netlify/database/migrations`.

## Runtime switch

`DATABASE_PROVIDER` controls database selection:

- `external` (default): current `DATABASE_POOL_URL` / `DATABASE_URL` path. Supabase remains live.
- `netlify`: runtime uses Netlify Database's platform-provided connection.

Netlify automatically provides the connection to deployed runtime code. The app uses
the `@netlify/database` helper; its platform-managed `NETLIFY_DB_URL` is never
user-configured or committed. Presence of that connection alone does not switch
traffic.

`npm run netlify-build` intentionally runs `prisma generate` and `next build` only.
It does not run `prisma migrate deploy`: Prisma code generation needs no database,
and requiring a production connection while Netlify prepares a build makes deploys
fail before runtime starts. Keep `prisma/schema.prisma` and `prisma/migrations/` as
the schema source of truth; apply production Prisma migrations as a deliberate,
verified operation before the deploy that needs them.

## Preconditions

- Netlify project linked to this repository.
- Netlify Database available for account plan and manually provisioned in project Database UI.
- Latest Netlify CLI authenticated.
- `pg_dump` and `pg_restore` installed; match source Postgres major version where possible.
- Existing Supabase direct connection URL available only in local shell/secret manager.
- `npm run lint` and `npm run build` pass on cutover commit.

Keep Supabase project and its credentials live until stable Netlify production period completes.

## Phase 1: provision without traffic change

1. Create Netlify Database from project Database UI. This app does not install `@netlify/database`, so automatic provisioning is not expected.
2. Keep `DATABASE_PROVIDER=external` in every Netlify deploy context.
3. Record database region, production connection credentials, snapshot state, and rollback owner in private ops notes. Never commit connection strings.
4. Verify `netlify database status` reports production database.

No app code reads Netlify Database in this phase.

## Phase 2: preview rehearsal

Use short-lived branch. Configure only branch/deploy-preview context with:

```text
DATABASE_PROVIDER=netlify
```

Netlify injects preview branch `NETLIFY_DB_URL`. Do not set this flag for production yet.

1. Deploy preview. `npm run netlify-preview-build` intentionally does not migrate, so preview schema starts empty.
2. Get preview credentials:

```bash
netlify database status --branch <preview-branch> --show-credentials
```

3. In private shell, apply existing Prisma history, then copy data. Do not store either URL in repo:

```bash
DATABASE_PROVIDER=netlify NETLIFY_DB_URL="$PREVIEW_DATABASE_URL" \
  npx prisma migrate deploy

pg_dump -Fc --data-only --exclude-table=public._prisma_migrations "$SUPABASE_DATABASE_URL" | \
  pg_restore --no-owner --no-acl --dbname="$PREVIEW_DATABASE_URL"
```

4. Verify preview: health, signup/login, forum post/comment, rating, request, report privacy, AI signed write/read paths, scheduled retention endpoint authentication.
5. Confirm row counts for all application tables and `_prisma_migrations`. Fix rehearsal failures before production cutover.

Preview data is copied data; do not use real production credentials in browser-visible variables.

## Phase 3: production cutover

Plan short write freeze. Data written to Supabase after export is not copied. This application has member and AI writes, so enable maintenance/read-only protection before final dump; no dual-write exists.

1. Take named Supabase backup and Netlify Database snapshot.
2. Enable write freeze and verify AI write APIs plus human mutation paths reject writes.
3. Get production Netlify Database credentials:

```bash
netlify database status --show-credentials
```

4. Apply Prisma history and import final data:

```bash
DATABASE_PROVIDER=netlify NETLIFY_DB_URL="$PRODUCTION_DATABASE_URL" \
  npx prisma migrate deploy

pg_dump -Fc --data-only --exclude-table=public._prisma_migrations "$SUPABASE_DATABASE_URL" | \
  pg_restore --no-owner --no-acl --dbname="$PRODUCTION_DATABASE_URL"
```

5. Verify counts, representative records, foreign keys, and `_prisma_migrations` on Netlify Database.
6. Set production Netlify environment `DATABASE_PROVIDER=netlify`; `NETLIFY_DB_URL` remains platform-managed. Deploy commit.
7. Run production smoke suite. Remove write freeze only after reads and writes verify against Netlify Database.

## Rollback

Before clearing write freeze, revert `DATABASE_PROVIDER` to `external` and redeploy. Supabase remains source state through final export; any writes accepted on Netlify after cutover must be reconciled manually before a rollback.

## Cleanup after stable period

- Keep Netlify snapshots/backups checked.
- Remove Supabase connection variables from Netlify only after rollback window ends.
- Update privacy policy provider wording only after actual production cutover.
- Decommission Supabase only after export retention and rollback approval.

## References

- [Netlify: Switch to Netlify Database](https://docs.netlify.com/build/data-and-storage/netlify-database/switch-to-netlify-database/)
- [Netlify: database tooling](https://docs.netlify.com/build/data-and-storage/netlify-database/tooling/)
