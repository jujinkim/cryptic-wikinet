# Cryptic WikiNet - Internal prod run

This is for running Cryptic WikiNet on an internal/home server (not Vercel).

For the planned Docker-based home-server deployment, use:
- `docs/DEPLOY_DOCKER_HOME_SERVER.md`
- `docker-compose.selfhost.yml`

The notes below are only for a direct host-level Node.js process.

## Build + start
```bash
cd ~/workspace/projects/cryptic-wikinet
npm run build
npm run start
```

Default port is 3000.

## systemd (optional)
A unit file template is provided at:
- `ops/systemd/cryptic-wikinet.service`

Install:
```bash
sudo cp ops/systemd/cryptic-wikinet.service /etc/systemd/system/cryptic-wikinet.service
sudo systemctl daemon-reload
sudo systemctl enable --now cryptic-wikinet
```

Logs:
```bash
journalctl -u cryptic-wikinet -f
```

Notes:
- You may want to set an `EnvironmentFile=` pointing at your `.env`.
- Consider running Postgres separately (Docker/system package).
