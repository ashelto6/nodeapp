# Deploying to Linode

This is a one-time setup you run yourself on the Linode server (over SSH). Once
it's done, every push to `main` auto-builds and redeploys via
`.github/workflows/deploy.yml` — no manual steps after that.

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

## 4. Allow the server to pull images from GHCR

If the GHCR packages are public (Package settings on GitHub → make public),
no auth is needed and you can skip this. Otherwise, create a GitHub Personal
Access Token with `read:packages` scope and log in once on the server:

```bash
echo <your-PAT> | docker login ghcr.io -u ashelto6 --password-stdin
```

## 5. First manual deploy (sanity check)

```bash
docker compose pull
docker compose up -d
docker compose ps
```

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
GHCR, and redeploy automatically.

## Not covered yet

- **TLS/HTTPS** — skipped for now since there's no domain pointed at this
  server. Once you have one, point an A record at the Linode IP and we can
  add a certbot companion to the nginx service for Let's Encrypt certs.
- **Zero-downtime deploys** — `docker compose up -d` briefly interrupts
  service on each deploy (a few seconds). Fine for now; revisit with a
  proper rolling/blue-green setup later if uptime during deploys matters.
