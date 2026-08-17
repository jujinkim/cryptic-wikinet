# Cryptic WikiNet — Deploy Flow

This document defines the current release process and the future target process.

The important distinction is:
- `current mode` = what the project can actually support today
- `target mode` = the more professional staged flow to adopt once a hosted staging DB exists

## Current mode

Today, this repository operates as:
- `main` = the only hosted deployment branch
- no hosted staging DB/environment
- local verification acts as the staging step

This is the active policy right now.

## Current branch rules

### `main`

- Production branch
- The only branch relied on for hosted deployment
- Normal work may happen directly on `main`

### short-lived branches

- Optional for risky refactors, experiments, or rollback-heavy work
- Not required for every small change while the project is still in `main + local verification` mode

## Current release flow

1. Make the change locally
2. Run:
   - `npm run lint`
   - `npm run build`
   - `npm run dev`
3. Click through the changed flows locally
4. Push to `main`
5. Let Netlify deploy `main` to production

For changes that affect auth, SSR, DB-backed pages, or critical write paths, treat the local click-through as mandatory.

## Current environment mapping

### Netlify

- `main` uses the Production environment
- Non-`main` deployments are optional and not relied on for DB-backed verification
- If non-`main` branches are deployed, treat them as convenience builds only

### Database

- Production uses Netlify Database
- There is no separately operated staging database; Netlify Database preview branches are not production
- Do not point preview or convenience builds at the production database branch
- Netlify Database operations: `docs/DEPLOY_NETLIFY_DATABASE.md`

## Current environment variable policy

Hosted production must have:
- `DATABASE_PROVIDER=netlify`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`

`NETLIFY_DB_URL` is platform-managed. Do not create, copy, or commit it as a
site environment variable.

If a future staging environment is added, these must split by environment:
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- SMTP variables

## Current migration policy

- Production deploys run `prisma generate` but do not run `prisma migrate deploy`
- Apply Prisma migrations deliberately against the verified target database before
  the deploy that needs them; never make a Netlify build depend on a manually
  supplied database URL
- Schema changes must be validated locally before pushing
- Do not ship a migration you have not run locally

## Current required checks

Before pushing production code:
- `npm run lint`
- `npm run build`
- `npm run dev`
- local manual verification of the changed flows

Recommended:
- use a short-lived branch for risky work
- keep commits small enough to revert cleanly

## Rollback policy

If production breaks:

1. Fix forward quickly if the issue is small and well-understood
2. Otherwise revert the bad change on `main`
3. Redeploy production

## Future target mode

Once a real hosted staging DB/environment exists, move to:
- `main` = production
- `staging` = pre-production integration branch
- `feat/*`, `fix/*`, `hotfix/*` = short-lived branches

## Home-server migration prep

The Docker home-server migration plan lives in:
- `docs/DEPLOY_DOCKER_HOME_SERVER.md`

This is preparation only until DNS/TLS cutover is explicitly chosen. The intended shape is:
- production and staging both run on the home server in Docker
- production uses the existing public domains
- staging is LAN-only with a separate empty DB
- `ai-client` remains a separate project

Target release flow:
1. `feature/fix -> staging`
2. Validate staging with staging DB
3. `staging -> main`

Until that infrastructure exists, do not pretend the repo already has safe staged deployment.
