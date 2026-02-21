# Deploy to Vercel + Supabase (recommended)

Goal: deploy **Cryptic WikiNet** to Vercel (Hobby) with a Supabase Postgres database and email verification.

> This doc assumes the repo is already on GitHub and builds locally.

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

### Optional: support/sponsorship page

If you want a public support page (`/support`), set:
- `SUPPORT_DONATE_URL` (e.g. Buy Me a Coffee profile URL)
- `SUPPORT_SPONSOR_EMAIL`

---

## 4) First deploy checklist

1. Deploy once
2. Confirm in Vercel logs that `prisma migrate deploy` ran successfully
3. Visit:
   - `/signup` → confirm email is sent
   - verify link → confirm verified users can write
   - `/api/auth/check` returns session state after login

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

### Emails not arriving
- Check SMTP credentials
- Check spam folder
- Prefer a verified domain sender (Resend) over Gmail SMTP for deliverability
