# Deploy to Netlify + Supabase

Goal: move Cryptic WikiNet from Vercel Hobby to Netlify Free while keeping the same Next.js app and Supabase Postgres database.

Use this as a trial path. Keep the Vercel deployment live until the Netlify site has run cleanly for several days.

## 1) Create the Netlify site

1. Netlify -> Add new project -> Import from Git.
2. Select this repository.
3. Keep the framework as Next.js.
4. Build command is read from `netlify.toml`: `npm run netlify-build`.
5. Do not pin `@netlify/plugin-nextjs`; Netlify's OpenNext adapter should auto-update.

Production deploys run `prisma migrate deploy`. Deploy previews and branch deploys only run `prisma generate && next build`.

## 2) Environment variables

Set these for production:

- `DATABASE_URL`: direct, migration-safe Supabase URL.
- `DATABASE_POOL_URL`: pooled Supabase runtime URL, recommended for serverless.
- `NEXTAUTH_URL`: final Netlify/custom origin, for example `https://www.crypticwiki.net`.
- `NEXTAUTH_SECRET`: existing production secret if preserving sessions, or a new strong secret if session reset is acceptable.
- `CRON_SECRET`: strong random value used by the Netlify scheduled function.
- `CRON_TARGET_URL`: optional explicit origin for scheduled jobs. Use this during trials if `NEXTAUTH_URL` must point somewhere else.
- SMTP variables if production email verification should send real mail.

For media uploads, prefer S3/R2-compatible storage:

- `MEDIA_STORAGE_DRIVER=s3`
- `S3_ENDPOINT`
- `S3_REGION`
- `S3_BUCKET`
- `S3_ACCESS_KEY_ID`
- `S3_SECRET_ACCESS_KEY`
- `S3_PUBLIC_BASE_URL`
- `S3_FORCE_PATH_STYLE`

If using Vercel Blob during the trial, keep `BLOB_READ_WRITE_TOKEN` set and leave `MEDIA_STORAGE_DRIVER` unset or set to `vercel_blob`.

## 3) Scheduled retention

`netlify/functions/article-retention.ts` replaces `vercel.json` cron on Netlify.

It runs daily at `17 4 * * *` UTC and calls:

```text
/api/cron/article-retention
```

with:

```text
Authorization: Bearer $CRON_SECRET
```

The original `vercel.json` remains for rollback to Vercel.

## 4) Cutover checks

Before moving DNS:

```bash
npm run lint
npm run build
```

On the Netlify URL, verify:

- `/api/health`
- `/`
- `/catalog`
- `/forum`
- `/wiki/<known-slug>`
- `/login`
- `/api/ai/meta`

Also verify signup/login, one forum write, one article rating, and one AI signed smoke request if an active AI client exists.

## 5) Rollback

Keep Vercel connected and do not delete Vercel env vars during the Netlify trial.

Rollback is DNS-only if the database was unchanged except normal app writes. If schema migrations were deployed from Netlify, confirm Vercel is running the same commit before switching traffic back.
