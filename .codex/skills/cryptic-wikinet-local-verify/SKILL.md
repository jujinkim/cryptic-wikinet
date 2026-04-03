---
name: cryptic-wikinet-local-verify
description: Verify local build and runtime behavior for /home/jujin/workspace/projects/cryptic-wikinet before shipping changes. Use when asked to test locally, smoke-test a branch, confirm DB-backed pages still work, or validate wiki/forum/auth regressions without relying on hosted preview or staging.
---

# Cryptic WikiNet Local Verify

Use this skill only in `/home/jujin/workspace/projects/cryptic-wikinet`.

## When to use

Use this skill when:
- the user asks to test locally before pushing
- a branch should be smoke-tested end to end
- a change affects DB-backed pages, SSR, auth, wiki, forum, or request flows
- hosted preview/staging is unavailable or intentionally not trusted

Current repo reality:
- hosted staging is not relied on
- local verification is the effective staging step before shipping

## Default workflow

1. Run:

```bash
npm run lint
npm run build
```

2. If the change can fail only at runtime, start a local DB if needed:

```bash
docker compose up -d db
npx prisma migrate deploy
```

3. Start the built app:

```bash
npm run start -- --hostname 127.0.0.1 --port 3100
```

Use `npm run dev` instead only when the user specifically wants dev-mode behavior.

4. Exercise the changed flows directly with HTTP or browser-like checks.

Prefer:
- `curl` for page/API verification
- targeted HTML/text assertions with `rg`
- direct route checks over vague “server started” confirmation

## Repo-specific checks

### Wiki/document viewer changes

Check the actual page route, not just APIs:

```bash
curl -sS http://127.0.0.1:3100/wiki/<slug>
```

For sidebar regressions, verify:
- `This page` contains expected headings
- `Tags` shows current article tags
- `REFERENCE` reflects `[[other-entry]]` links from the body

If the local DB is empty, it is acceptable to create a minimal temporary article, verify the behavior, and remove the temporary data before finishing.

### Auth/forum/request/report changes

Prefer route-level checks:
- `/login`
- `/api/auth/check`
- `/forum`
- `/forum/<id>`
- `/request`
- `/reports`

If a flow requires verified data or seeded rows, create only the minimum temporary data needed and clean it up afterward.

## Decision rules

- Do not rely on Vercel Preview as the primary verifier for this repo.
- Do not assume `build passed` means runtime is safe.
- If the changed code touches serialization, caching, route params, or DB reads, do a real runtime check.
- If verification required temporary local DB data, say so in the final report.

## Finish cleanly

Before finishing:
- stop any local server process you started unless the user asked to keep it running
- remove any temporary verification data you inserted
- report exactly what was verified locally and what was not
