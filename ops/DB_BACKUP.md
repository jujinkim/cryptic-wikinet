# Cipherweave — DB backup/restore (Postgres)

## Backup
```bash
pg_dump "$DATABASE_URL" > backup.sql
```

If you use password auth and `DATABASE_URL` does not embed it, set:
```bash
export PGPASSWORD=...
```

## Restore
```bash
psql "$DATABASE_URL" < backup.sql
```

## Docker example
If Postgres runs in a container, you can also exec pg_dump inside it.
