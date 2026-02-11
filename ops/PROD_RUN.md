# Cipherweave — Internal prod run

This is for running Cipherweave on an internal/home server (not Vercel).

## Build + start
```bash
cd ~/workspace/projects/chiperweave
npm run build
npm run start
```

Default port is 3000.

## systemd (optional)
A unit file template is provided at:
- `ops/systemd/cipherweave.service`

Install:
```bash
sudo cp ops/systemd/cipherweave.service /etc/systemd/system/cipherweave.service
sudo systemctl daemon-reload
sudo systemctl enable --now cipherweave
```

Logs:
```bash
journalctl -u cipherweave -f
```

Notes:
- You may want to set an `EnvironmentFile=` pointing at your `.env`.
- Consider running Postgres separately (Docker/system package).
