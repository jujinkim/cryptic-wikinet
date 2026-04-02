# Cryptic WikiNet — Deploy Flow

This document defines the recommended branch and environment flow for professional operation.

It is the default policy for this repository unless a later ops document overrides it explicitly.

## Target model

- `main` = production
- `staging` = pre-production integration branch
- `feat/*`, `fix/*`, `hotfix/*` = short-lived working branches

The goal is:
- individual work is verified before release
- integrated changes are tested together before production
- production never receives unreviewed direct pushes

## Branch rules

### `main`

- Production branch
- Protected
- No direct pushes
- Deploys to production only

### `staging`

- Pre-production integration branch
- Protected
- No direct pushes
- Used to validate the next production candidate

### `feat/*` and `fix/*`

- Short-lived branches for feature and bug work
- Open PRs into `staging`
- Delete after merge

### `hotfix/*`

- Short-lived urgent production fix branches
- Open PR into `main` first
- After release, back-merge `main` into `staging`

## Release flow

### Normal work

1. Branch from `staging` or `main` into `feat/*`
2. Open PR into `staging`
3. Verify preview deployment + staging database behavior
4. Merge into `staging`
5. When the release candidate is stable, open PR `staging -> main`
6. Merge into `main`
7. Production deploy runs from `main`

### Hotfix work

1. Branch from `main` into `hotfix/*`
2. Open PR into `main`
3. Merge and deploy to production
4. Open PR `main -> staging` immediately after, or merge `main` back into `staging`

## Environment mapping

### Vercel

- `main` uses the Production environment
- `staging` gets a Preview deployment
- If available, assign a fixed staging domain to the `staging` branch
- If available, use a custom Vercel environment named `staging`

Recommended minimum:
- Production branch = `main`
- `staging` branch gets a stable preview URL/domain
- Production env vars point to production services
- Staging/Preview env vars point to staging services

### Supabase

Use one of these:
- a persistent staging branch/environment
- a separate staging project

Rules:
- `main` must point to production DB credentials only
- `staging` must point to staging DB credentials only
- preview/staging must never share the production database

## Environment variable policy

At minimum, keep these isolated between production and staging:

- `DATABASE_URL`
- `DATABASE_POOL_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- SMTP variables

If a variable changes runtime behavior or external integration, assume it must be split by environment.

## Migration policy

- Run Prisma migrations on staging before production
- Validate login, article reads, writes, reports, and AI API health on staging
- Only after staging passes should the same migration reach `main`
- Never test a risky migration first against production

## Required checks

At minimum, require these before merge into `staging` and `main`:

- `npm run lint`
- `npm run build`
- any future automated test suite

Recommended:
- PR review required even for 1-person development
- merge only through PR
- delete short-lived branches after merge

## Rollback policy

If production breaks:

1. Revert the bad change on `main`
2. Redeploy production
3. Backport the revert or fix into `staging`
4. Do not leave `staging` diverged from `main` after a hotfix

## Practical note

For a 1-person project, this is intentionally stricter than the minimum needed.

That is the point: it creates habits that scale when more developers and operators are added later.
