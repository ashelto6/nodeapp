# Deploying to Linode

This is a one-time setup you run yourself on the Linode server (over SSH). Once
it's done, a push to `main` that changes a runtime path auto-builds and
redeploys via `.github/workflows/deploy.yml` — no manual steps after that.
Docs-only or other non-runtime pushes are skipped by the workflow's `paths`
allowlist (issue #76); see [Wire up GitHub Actions](#6-wire-up-github-actions) below.

## 1. Harden the server

SSH in as root the first time, then:

```bash
# Create a non-root user with sudo access
adduser deploy
usermod -aG sudo deploy

# Copy your SSH public key to the new user so key-based login works
rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy

# From here on, log in as `deploy`, not root
```

As `deploy` (with sudo), lock down SSH and add a firewall:

```bash
sudo sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
sudo systemctl restart ssh

sudo apt update && sudo apt install -y ufw fail2ban unattended-upgrades
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
sudo systemctl enable --now fail2ban
```

This gives you: no root login, no password login (key-only), a firewall that
only allows SSH/HTTP/HTTPS, brute-force protection, and automatic security
patches.

**Important caveat**: Docker inserts its own `iptables` rules directly for
any port it publishes, in a way that bypasses `ufw` entirely — `ufw`'s
rules above do **not** actually govern which Docker-published ports are
reachable from the internet. The real enforcement for this app is the
**Linode Cloud Firewall** (a separate, network-level firewall configured
in the Linode dashboard, not on the server itself) — see step 1a below.
Properly integrating `ufw` with Docker (e.g. via the `ufw-docker` project)
is tracked as a follow-up, not yet done.

## 1a. Configure the Linode Cloud Firewall

In the Linode dashboard, under **Firewalls** (a separate section from the
Linode itself):
1. Create a firewall and attach it to this Linode.
2. Add inbound rules: TCP 22 (SSH), TCP 80 (HTTP), TCP 443 (HTTPS), sources
   set to all IPv4/IPv6. Save.
3. Only after those rules are saved: set **Inbound Policy: Drop** and
   **Outbound Policy: Accept**, then save again. (Setting Drop before the
   rules exist will lock out SSH — Linode's Lish console, authenticated
   with the root password, is the fallback if that happens.)

## 2. Install Docker

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker deploy
# log out and back in for the group change to apply
```

Confirm you have the Compose **v2** plugin, not just the legacy `docker-compose`
v1 binary — the deploy workflow runs `docker compose ...` (with a space):

```bash
docker compose version
```

If that fails, `get.docker.com` should already have installed it as part of
`docker-ce-cli`; if not, install `docker-compose-plugin` for your distro.

## 2a. Configure Docker log rotation

Docker's default `json-file` log driver has **no size cap** — container logs
grow unbounded until the disk fills, silently, since nothing looks unhealthy
until it does (issue #53). Set a daemon-wide default before starting the app
so every container, present and future, inherits it:

```bash
sudo tee /etc/docker/daemon.json > /dev/null <<'EOF'
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF
sudo systemctl restart docker
```

This caps each container at 3 rotated 10MB files (30MB max per container).

**This setting only applies to containers created after the restart** — on a
fresh server (first-ever `docker compose up` in step 5 below) that's
automatic. On a server that already has the app running, existing containers
must be recreated to pick it up:

```bash
docker compose -f docker-compose.yaml up -d --force-recreate
```

Verify it took effect:

```bash
docker inspect ${SERVER_HOST} --format '{{json .HostConfig.LogConfig}}'
# expect: {"Type":"json-file","Config":{"max-file":"3","max-size":"10m"}}
```

## 3. Clone the app and configure it

```bash
git clone https://github.com/ashelto6/nodeapp.git
cd nodeapp
cp .env.example .env
# edit .env if you want different ports/hostnames than the defaults
```

`.env` is gitignored — it stays local to the server and is never pushed to
GitHub.

**Set `NGINX_PORT=80` in production** rather than leaving the `.env.example`
default of `9999` (that default is a local-dev convenience value only).
Using the standard HTTP port means the site is reachable at the bare IP/
domain with no port number needed, and matches the firewall rules below
(only 22/80/443 are allowed in) without needing a one-off exception for a
non-standard port.

Set `MONGO_APP_USERNAME`/`MONGO_APP_PASSWORD` to values distinct from the
`MONGO_INITDB_ROOT_*` root credentials above — see issue #67. On a **brand
new** server (fresh `mongo-data` volume, first-ever `docker compose up`),
`mongo/init/create-app-user.js` creates this user automatically and there's
nothing else to do.

### Migrating an existing production Mongo volume (issue #67)

The init script above only runs when Mongo initializes a *fresh* volume —
it does **not** run against a volume that already has data, which is the
case for this app's current production server. On that server, the scoped
app user must be created manually, **before** merging/deploying the PR that
switches `server/src/db.js` to require `MONGO_APP_USERNAME`/
`MONGO_APP_PASSWORD` — otherwise the server container will restart on
deploy and fail to authenticate (root creds still work for Mongo itself,
but the app will no longer use them).

1. Back up the volume first, in case a typo below needs undoing:
   ```bash
   docker compose exec mongo sh -c '
     mongodump --authenticationDatabase admin \
       -u "$MONGO_INITDB_ROOT_USERNAME" -p "$MONGO_INITDB_ROOT_PASSWORD" \
       --archive=/data/db/pre-67-backup.archive
   '
   ```
2. Add `MONGO_APP_USERNAME`/`MONGO_APP_PASSWORD` to the server's `.env` (pick
   a fresh, random password — do not reuse the root password), then
   `docker compose up -d mongo` to pick up the new env vars in the container.
3. Create the user by running the same init script the fresh-volume path
   uses, against the already-running container, authenticated as root:
   ```bash
   docker compose exec mongo sh -c '
     mongosh admin -u "$MONGO_INITDB_ROOT_USERNAME" -p "$MONGO_INITDB_ROOT_PASSWORD" \
       /docker-entrypoint-initdb.d/create-app-user.js
   '
   ```
   Reusing `mongo/init/create-app-user.js` (rather than retyping the
   `createUser` call) keeps the manual migration and the automatic
   fresh-volume path from drifting apart. The command is entirely
   env-var driven — the password is never typed on the command line or
   written to shell history.
4. Only after the user exists, merge the PR — the next deploy restarts
   `server` against the new credentials.

## 4. Allow the server to pull images from GHCR

If the GHCR packages are public (Package settings on GitHub → make public),
no auth is needed and you can skip this. Otherwise, create a GitHub Personal
Access Token with `read:packages` scope and log in once on the server:

```bash
echo <your-PAT> | docker login ghcr.io -u ashelto6 --password-stdin
```

## 5. First manual deploy (sanity check)

```bash
docker compose -f docker-compose.yaml pull
docker compose -f docker-compose.yaml up -d
docker compose -f docker-compose.yaml ps
```

`-f docker-compose.yaml` is required here, not optional — without it,
Compose auto-applies `docker-compose.override.yml` (present in the
cloned repo too) and tries to pull `:dev`-tagged images that were never
pushed to GHCR, since only `:latest`/`:<sha>` get published.

Visit `http://<linode-ip>:<NGINX_PORT>` to confirm it's serving.

## 6. Wire up GitHub Actions

In the GitHub repo: **Settings → Secrets and variables → Actions**, add:

| Secret            | Value                                              |
|--------------------|-----------------------------------------------------|
| `LINODE_HOST`      | server IP or hostname                              |
| `LINODE_USER`      | `deploy`                                           |
| `LINODE_SSH_KEY`   | private key matching a public key in `deploy`'s `~/.ssh/authorized_keys` |
| `LINODE_APP_DIR`   | absolute path, e.g. `/home/deploy/nodeapp`         |

Push to `main` (or merge a PR into it) and the workflow will build, push to
GHCR, and redeploy automatically — **as long as the push changes a runtime
path**. The `push` trigger in `deploy.yml` carries a `paths` allowlist
(`server/`, `client/`, `nginx/`, the Dockerfiles/lockfiles inside them, the
root `.dockerignore`, the compose files, `.env.example`, and `deploy.yml`
itself). A push that touches only non-runtime files (docs, `LICENSE`,
unrelated CI workflows) is skipped, so a Markdown-only merge no longer
triggers a full redeploy (issue #76). A push that touches both docs and a
runtime path still deploys. Keep the allowlist in sync when adding new
runtime directories.

## 7. Uptime monitoring (issue #34)

External monitoring runs on **UptimeRobot** (free tier, under the
project owner's account — not recreatable from this repo alone):

- Monitor type: HTTP(s), checking `http://<linode-ip>/api/health`
  every 5 minutes **from the public internet** — the same path real
  users take, which the deploy gate (localhost-side) can't see.
  A firewall misconfiguration or full outage between deploys is
  caught here and nowhere else.
- `/api/health` returns 200 only when fully healthy and **503 when
  degraded** (e.g. Mongo unreachable — see issue #52), so the monitor
  alerts on partial failures too, not just a dead server.
- Alerts go to the owner's email. If rebuilding this setup: create the
  monitor with the values above; there is nothing to configure
  server-side.

## 8. Error tracking (issue #35)

Runtime exceptions are captured to **Sentry** (free tier, owner's
account, Express project, error monitoring only -- no tracing or
profiling). Server-side setup is one line: `SENTRY_DSN=<dsn>` in the
server's `.env`. Without that variable Sentry is a no-op by design
(tests, CI, and local dev stay offline). Only unexpected errors (the
sanitized-500 path) are captured; intentional HttpErrors (404s,
validation 400s) never are. If rebuilding: create a Sentry project
(platform: Express), put its DSN in the production `.env`, restart the
server container.

## Not covered yet

- **TLS/HTTPS** — skipped for now since there's no domain pointed at this
  server. Once you have one, point an A record at the Linode IP and we can
  add a certbot companion to the nginx service for Let's Encrypt certs.
- **Zero-downtime deploys** — `docker compose up -d` briefly interrupts
  service on each deploy (a few seconds). Fine for now; revisit with a
  proper rolling/blue-green setup later if uptime during deploys matters.
