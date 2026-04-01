---
name: cryptic-wikinet-migrations
description: Handle schema changes, Prisma migrations, and production migration application for /home/jujin/workspace/projects/cryptic-wikinet. Use when editing prisma/schema.prisma, adding prisma/migrations, applying migrations to the Cryptic WikiNet Supabase project, resolving Prisma migration state, or verifying production schema changes.
---

# Cryptic WikiNet Migrations

Use this skill only in `/home/jujin/workspace/projects/cryptic-wikinet`.

## Scope

Use this skill when:
- changing `prisma/schema.prisma`
- adding or editing `prisma/migrations/*`
- applying a migration to the production Supabase project
- resolving `_prisma_migrations` state
- checking whether a production schema change really landed

## Core rules

- Source of truth is `prisma/schema.prisma` plus `prisma/migrations`.
- Do **not** create Supabase CLI migration files for this repo.
- Prefer Prisma migration flow first. Supabase is the target database, not the migration authoring system.
- Do not commit `.env`.
- If you temporarily run `supabase init` / `supabase link`, remove the generated `supabase/` directory before finishing unless the user explicitly asks to keep it.

## Normal workflow

1. Update `prisma/schema.prisma`.
2. Add the matching migration under `prisma/migrations`.
3. Run:

```bash
npx prisma generate
npm run lint
npm run build
```

4. If a local direct DB is available, prefer:

```bash
npx prisma migrate dev
```

If local DB is unavailable, it is acceptable to add the migration SQL manually, as long as it matches the schema change exactly.

## Production apply workflow

Preferred order:

1. If you have a direct non-pooling production DB URL, use Prisma:

```bash
DATABASE_URL="postgresql://...direct..." npx prisma migrate deploy
```

2. If direct Prisma deploy is unavailable but Supabase login is available, use the Supabase project as the execution target while keeping Prisma as the migration source of truth.

Current production project ref:

```text
gkiffvkfbjfsmybetrwm
```

Helpful setup:

```bash
npx supabase init --workdir . --yes
npx supabase link --project-ref gkiffvkfbjfsmybetrwm --workdir .
```

## Supabase fallback

If Prisma deploy is blocked and `supabase db query --linked` is unstable, use the Supabase Management API `database/query` endpoint with the local Supabase access token.

Use this fallback to:
- apply the SQL from the Prisma migration file
- then insert or update the matching `_prisma_migrations` row so Prisma state stays aligned

Checklist for this fallback:
- apply the exact SQL from `prisma/migrations/<name>/migration.sql`
- use the migration file checksum when inserting `_prisma_migrations`
- verify both the schema change and the `_prisma_migrations` row afterward

## Verification

After any production apply:

- verify the target columns / indexes / tables exist
- verify the migration row exists in `_prisma_migrations`
- keep the repo worktree clean

## Avoid

- Do not run `supabase migration new` for this repo.
- Do not leave production schema changed without matching Prisma migration history.
- Do not leave temporary `supabase/` files untracked in the repo.
- Do not use the pooler URL as the primary Prisma migration URL when a direct URL is available.
