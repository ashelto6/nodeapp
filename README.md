# nodeapp

A MERN (MongoDB, Express, React, Node) app behind nginx, deployed to Linode
via GitHub Actions.

- [ARCHITECTURE.md](ARCHITECTURE.md) — architecture decisions, code-structure
  conventions, planned platform targets, and deliberately-deferred gaps
- [CONTRIBUTING.md](CONTRIBUTING.md) — issue/branch/PR workflow
- [DEPLOY.md](DEPLOY.md) — Linode server setup, deploy pipeline, uptime
  monitoring, and error tracking
- [LICENSE](LICENSE) — PolyForm Noncommercial 1.0.0 (commercial use reserved)

## Local development

Requires Docker with the Compose **v2** plugin (`docker compose version` must
work — the legacy v1 `docker-compose` binary is not enough).

1. Copy the example env file and adjust values if needed:
   ```bash
   cp .env.example .env
   ```
2. Start the full stack in dev mode (hot-reload client + server, nginx
   proxying to the Vite dev server), detached so your terminal stays free:
   ```bash
   docker compose up -d
   ```
   `docker-compose.override.yml` is picked up automatically alongside
   `docker-compose.yaml` whenever you run `docker compose` with no `-f`
   flags — no extra flags needed for the dev shape. Want live logs?
   `docker compose logs -f` (or `-f <service>` for one service).
3. Open `http://localhost:<NGINX_PORT>` (default `9999`) in a browser.
   This loads the React client, which calls `/api/health` (proxied
   through nginx to Express) — you should see the API status and Mongo
   connection state rendered on the page. The health endpoint's contract
   is carried by its status code: 200 only when fully healthy, 503 when
   degraded (e.g. Mongo unreachable) — in which case the page shows its
   error state. In dev mode you can also hit the Vite dev server directly
   at `http://localhost:<CLIENT_PORT>` (default `5173`), bypassing nginx.
4. Edits to files under `client/` or `server/` hot-reload automatically
   (Vite HMR for the client, `nodemon` for the server).

### Testing the production shape locally

The dev override adds hot-reload and a `client` dev-server container that
don't exist in production — nginx instead serves a static React build
baked into its own image. To build/run that shape locally instead:

```bash
docker compose -f docker-compose.yaml up --build
```

Passing `-f` explicitly disables Compose's automatic pickup of
`docker-compose.override.yml`.

### Running tests

Both `server/` and `client/` have Vitest suites, run the same way in
each directory (locally with Node 20, or via the same container image
the Docker builds use):

```bash
cd server && npm test
cd client && npm test
# or without local Node:
docker run --rm -v "$(pwd)/server:/server" -w /server node:20-alpine npm test
```

CI runs both suites on every pull request (the `test` check), and
`test`, `build`, and `lint` must pass before a PR can merge.

CI runs the suites with a **coverage gate** (`npm run test:coverage`):
thresholds live in `server/vitest.config.js` and `client/vite.config.js`,
set just under measured coverage so CI fails on regression. When coverage
grows, ratchet the thresholds up — never lower them to make a failing PR
pass. Every `src/` file counts toward coverage (untested files can't hide
by never being imported); the few deliberate exclusions are the
side-effect-only entry points, each documented in the config.

### Linting and formatting

Both packages use **ESLint** (code quality) and **Prettier** (formatting),
configured independently since they target different runtimes — the server is
Node/Express, the client is React under Vite. Each directory has the same
scripts:

```bash
cd server   # or: cd client
npm run lint          # ESLint; fails on any error or warning
npm run format:check  # Prettier; fails if anything is unformatted
npm run format        # Prettier; rewrites files in place
```

CI runs `lint` + `format:check` for both packages as the `lint` check on every
pull request. Formatting is deliberately per-package: server code is 4-space
indented, client code 2-space, each matching how that package was already
written — Prettier enforces that rather than reformatting one to match the
other.

### Useful commands

| Command | What it does |
|---|---|
| `docker compose up -d` | Start everything in dev mode, detached (override auto-applied) |
| `docker compose build` | Build all images (dev shape, since override auto-applies) |
| `docker compose down` | Stop and remove containers |
| `docker compose logs -f <service>` | Tail a specific service's logs (`server`, `nginx`, `client`, `mongo`) |

**Shutting down properly**: run `docker compose down` when you're done,
not just `Ctrl+C` on a foreground `docker compose up`. `Ctrl+C` only
*stops* the containers — it doesn't remove them, so they keep holding
their container names and cause a "name already in use" conflict the
next time you run `up`. `down` stops *and* removes them cleanly. It does
not delete your Mongo data (the named volume persists on purpose); use
`docker compose down -v` only if you deliberately want to wipe the
database too.

### Services

| Service | Container name (env var) | Port (env var) |
|---|---|---|
| nginx (entrypoint) | `NGINX_HOST` | `NGINX_PORT` |
| server (Express API) | `SERVER_HOST` | `SERVER_PORT` |
| client (Vite dev server, dev only) | `CLIENT_HOST` | `CLIENT_PORT` |
| mongo | `MONGO_HOST` | `MONGO_PORT` |

## License

[PolyForm Noncommercial 1.0.0](LICENSE) — noncommercial use and
modification permitted; commercial use reserved to the copyright holder.
