# MERN restructure (issue #5)

This documents the plan and reasoning for turning this app into a MERN
(MongoDB, Express, React, Node) stack, for reference — especially useful
since this is a first pass with Mongo and React in this project.

## What's actually changing

Today the app is one thing: Express serves a plain HTML file with a script
tag. MERN splits that into separate pieces that talk to each other over
HTTP instead of one program handing over a finished page:

- **React (the "client")** — runs in the browser. It's the program that
  builds the actual page the user sees and interacts with. It is not a
  file Express hands over anymore; it's its own separate program with its
  own dependencies and build process.
- **Express (the "server")** — instead of serving HTML, it becomes a pure
  **API**: it only answers requests like "give me the list of X" with raw
  data (JSON), no HTML involved.
- **MongoDB ("Mongo")** — a database. Where before the app had no
  persistent data at all, Mongo is where Express stores and retrieves
  information.

Request flow becomes: browser loads the React page → React's JavaScript
calls Express (`/api/...`) → Express asks Mongo for data → Mongo replies →
Express replies to React → React updates what's on screen.

## Decisions

### 1. Who serves the built React files in production: nginx or Express?

**Chosen: nginx.**

React isn't a live program you run in production — you "build" it into a
folder of plain HTML/CSS/JS files. Something has to hand those files to
the browser. nginx already sits in front of everything as the reverse
proxy and is much faster at serving static files than Express is. So
nginx serves the built React files for `/`, and forwards anything under
`/api/` to Express. Express never touches HTML again — it's 100% API.

This also avoids CORS entirely (client and API appear same-origin from
the browser's point of view), and means the static tier can later move to
a CDN without touching Express at all.

### 2. How do you develop the React app day-to-day?

**Chosen: `client` runs as its own Docker Compose service.**

Editing React code benefits from hot-reload (the browser updates
instantly as you save), which needs a dev server (Vite) running
continuously — different from the "build once into static files" step
used in production. Running this dev server as its own container keeps
the whole stack (client, server, database, proxy) consistent under
`docker compose up`, without requiring Node/npm installed locally.
Docker-on-Docker file-watching can be unreliable, so polling-based
watching (`server.watch.usePolling: true` in `vite.config`) will be
enabled.

### 3. Where does MongoDB run?

**Chosen: self-hosted `mongo` service in Docker Compose, for now.**

Options were self-hosting Mongo in a container, or a managed cloud
version (MongoDB Atlas) where backups/scaling are handled externally.
Self-hosting is simplest and free, good enough for learning and early
development. Migrating to Atlas is deferred to a future issue once there
is real data worth protecting with proper backups.

## Open implementation detail

nginx's routing needs to differ between dev and prod: in dev, `/` should
proxy to the `client` dev-server container (no build exists yet); in
prod, `/` is served as static files baked into the nginx image and there
is no `client` container at runtime. Likely needs a
`docker-compose.override.yml` (dev-only, auto-merged) plus either two
nginx config templates or an env-var-driven proxy target — to be worked
out during implementation.

## New/changed env vars

Add `MONGO_HOST`, `MONGO_PORT`, `MONGO_DB` (or a single `MONGO_URI`),
`CLIENT_HOST`, `CLIENT_PORT` to `.env.example`.
