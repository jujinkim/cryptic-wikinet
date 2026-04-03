# Deploy to Vercel + Supabase (recommended)

Goal: deploy **Cryptic WikiNet** to Vercel (Hobby) with a Supabase Postgres database and email verification.

> This doc assumes the repo is already on GitHub and builds locally.
>
> Branch and release policy lives in `docs/DEPLOY_FLOW.md`. This document focuses on Vercel/Supabase setup details.
>
> Current reality for this repository: production is hosted on Vercel, but there is no hosted staging DB yet. That means the practical flow today is `local verification -> main deploy`.

---

## 1) Create Supabase project

1. Create a new Supabase project
2. Go to **Project Settings → Database → Connection string**
3. Copy **two** URLs:

- **Direct connection** (port usually `5432`) → use for `DATABASE_URL`
- **Pooler connection** (port usually `6543`) → use for `DATABASE_POOL_URL`

Why two?
- Migrations are safest on the **direct** connection.
- Serverless runtimes are safest on a **pooled** connection.

---

## 2) Create a Vercel project

1. Vercel → **New Project** → import `cryptic-wikinet`
2. Framework preset: **Next.js**
3. Build command: keep default (Vercel will run `vercel-build` if present)

This repo provides:

```json
"vercel-build": "prisma generate && prisma migrate deploy && next build"
```

So every deployment applies Prisma migrations automatically.

Current recommended branch setup:

- Production branch: `main`
- Other branches: optional convenience branches only

Because this repo currently has no hosted staging DB, non-`main` Vercel deployments are not treated as trustworthy staging environments.

---

## 3) Set Vercel Environment Variables

### Required

- `NEXTAUTH_URL`
  - `https://<your-vercel-domain>`
- `NEXTAUTH_SECRET`
  - generate a long random string
- `DATABASE_URL`
  - Supabase **Direct** connection string
- `DATABASE_POOL_URL`
  - Supabase **Pooler** connection string

Notes:
- `DATABASE_POOL_URL` is used at runtime; `DATABASE_URL` is still used by migrations.
- Ensure SSL is enabled in the URL (`sslmode=require`) if Supabase requires it.
- If Supabase integration auto-injects only `POSTGRES_*` vars, this app supports them as fallbacks:
  - migrations: `POSTGRES_URL_NON_POOLING` (or `POSTGRES_URL`)
  - runtime: `POSTGRES_PRISMA_URL` / `POSTGRES_URL` / `POSTGRES_URL_NON_POOLING`
- For Supabase URLs with `sslmode=require|prefer|verify-ca`, the app auto-adds `uselibpqcompat=true` to avoid pg TLS mode incompatibility warnings/errors.

Recommended split today:

- `Production` env vars -> production Supabase + production auth origin
- `Development` env vars -> local machine

If you later add a real staging DB, then split `Preview/staging` separately.

For now, do not treat Preview as a real staging environment unless it has its own safe DB credentials.

### Email verification (required for member-only actions)

Production does **not** show dev verification links.
So you must configure SMTP.

Recommended: **Resend SMTP**

Set:
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `EMAIL_FROM` (e.g. `no-reply@your-domain.com`)

### Optional: Buy Me a Coffee button in footer

If you want a donation button in the site footer, set:
- `BUYMEACOFFEE_URL` (e.g. `https://www.buymeacoffee.com/yourname`)

---

## 4) First deploy checklist

1. Deploy once
2. Confirm in Vercel logs that `prisma migrate deploy` ran successfully
3. Visit:
   - `/signup` → confirm email is sent
   - verify link → confirm verified users can write
   - `/api/auth/check` returns session state after login

Current practical flow:
- verify locally first
- then deploy `main`

Local verification before pushing should include:
- `npm run lint`
- `npm run build`
- `npm run dev`
- clicking through the changed flows

---

## 5) OAuth (later)

Google OAuth is easiest once you have a stable domain.
Add your Vercel domain to Google OAuth redirect URIs:

- `https://<domain>/api/auth/callback/google`

Then set:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

---

## Troubleshooting

### Prisma connection errors on Vercel
- Make sure `DATABASE_POOL_URL` points to the pooler port (often `6543`).
- If you see prepared-statement issues with transaction pooling, switch the pooler mode or use the direct URL temporarily.
- If Vercel says `Missing DB URL for migrations`, remember that this app's build runs `prisma migrate deploy`, so hosted deployments need a migration-safe `DATABASE_URL` or `POSTGRES_URL_NON_POOLING`.

### Emails not arriving
- Check SMTP credentials
- Check spam folder
- Prefer a verified domain sender (Resend) over Gmail SMTP for deliverability
