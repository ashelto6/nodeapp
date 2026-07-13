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
a CDN without touching Express at all. That migration is tracked as
future work in #6, once there's a real domain and actual scale to
justify it.

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
development. Migrating to Atlas is deferred to #7, once there is real
data worth protecting with proper backups.

## How the nginx dev/prod split was resolved

`nginx/Dockerfile` is a multi-stage build with a `prod` stage (builds the
React client and copies its `dist/` into the nginx image, serving it as
static files) and a `dev` stage (skips the client build entirely). Two
separate config templates — `default.conf.prod.template` and
`default.conf.dev.template` — are copied in depending on which stage
builds; only the dev template proxies `/` to the `client` dev-server
container, with the `Upgrade`/`Connection` headers Vite's HMR needs.

`docker-compose.yaml` builds the `prod` target by default.
`docker-compose.override.yml` (auto-merged by Compose whenever you run
`docker compose` with no `-f` flags) switches nginx's `target` to `dev`
and adds the `client` service. See [README.md](README.md#local-development)
for the actual commands.

## New/changed env vars

Add `MONGO_HOST`, `MONGO_PORT`, `MONGO_DB` (or a single `MONGO_URI`),
`CLIENT_HOST`, `CLIENT_PORT` to `.env.example`.

## Server code structure (issue #37)

The Express server uses a standard layered layout under `server/src/`:

```
server/src/
  server.js        # bootstrap only: create app, mount routers, connect DB, listen
  db.js            # MongoDB connection setup (mongoose)
  routes/          # thin URL→controller maps, one router per feature (*.routes.js)
  controllers/     # request-handling logic, one per feature (*.controller.js)
  models/          # Mongoose schemas, one per collection (added as features need them)
  middleware/      # cross-cutting request/response handling (error handling, etc.)
  utils/           # small shared helpers (HttpError, asyncHandler)
```

Error handling is centralized (issue #39): unmatched routes get a JSON
404, and all thrown errors land in one error middleware mounted after
the routes. Controllers signal intentional failures by throwing
`HttpError(status, message)`; anything else returns a generic 500
without leaking internals. Async controllers must be wrapped in
`asyncHandler(...)` in their route file — Express 4 does not route
rejected promises to error middleware on its own.

Input validation is declared per-route with Zod (issue #40): any route
that accepts input attaches `validate({ body/params/query: schema })`
from `middleware/validate.middleware.js` ahead of its controller.
Failures become structured 400s through the error middleware; on
success the request part is replaced with Zod's parsed output (unknown
fields stripped, declared coercions applied), so controllers only ever
see clean data and never validate anything themselves. No route that
accepts input should ship without a schema.

## Client code structure (issue #38)

```
client/src/
  main.jsx         # React bootstrap: mounts <App> into #root
  App.jsx          # composition root; React Router mounts here when a 2nd page arrives
  pages/           # one component per screen; pages own data-fetching and state
  components/      # reusable presentational pieces; receive data via props, never fetch
  api/             # the only place fetch() is called:
                   #   client.js = generic request/error handling
                   #   <feature>.api.js = feature-scoped functions pages import
```

The client-side rules mirroring the server's: **components never fetch
(pages do, through `api/`), and `api/` modules contain no rendering.**
Two upgrades are deliberately deferred with explicit triggers: React
Router lands when the second page does, and a data-fetching library
(e.g. TanStack Query) replaces the plain `api/` modules when real
features need caching, mutations, or loading-state orchestration beyond
what a `useEffect` reasonably handles.

The rule that keeps this from rotting: **routes contain no logic,
controllers contain no route definitions, and server.js never gains
either** — a new feature means a new router file mounted in server.js,
a new controller, and (usually) a model. If a controller starts
accumulating non-HTTP business logic worth reusing or testing in
isolation, that's the trigger to introduce a `services/` layer between
controllers and models — deliberately not created up front.

## Planned platform targets (issue #56)

A **mobile client (React Native) is a declared future requirement**,
not a hypothetical. No mobile work is scheduled yet, but the constraint
steers decisions made in the meantime:

- **Auth must be designed token-friendly** (bearer tokens work
  identically in browsers and native apps). A cookie-only session
  design would need reworking for mobile — raise this at auth design
  time, whenever that happens.
- **TLS/HTTPS is a hard prerequisite for mobile** (iOS App Transport
  Security and modern Android block plain HTTP by default). Mobile
  work approaching is a second trigger — alongside "has a domain" —
  that ends the current HTTPS deferral.
- **API backward compatibility** becomes a real discipline once a
  store-distributed app exists (old app versions linger on phones for
  months and the API must not break them). Consider `/api` versioning
  conventions when the API grows real feature surface.
- The current architecture already supports this direction: the server
  is a pure JSON API with no HTML responsibilities (client-agnostic,
  and CORS is irrelevant to native apps since it's browser-enforced),
  and the client's `api/` layer is near-portable to React Native. UI
  components are not portable (DOM vs native primitives) — screens get
  rewritten, architecture carries over.

## Known gaps, deliberately deferred

Things that are genuine gaps but don't have a concrete next action yet —
listed here (rather than as issues) so the reasoning isn't lost, with the
condition that would turn each into real work.

- **Single point of failure.** One Linode box runs nginx, Express, and
  Mongo together, each as a single instance — no redundancy or load
  balancing. This isn't one fix but a staged evolution: #7 (Atlas) and #6
  (CDN) already peel Mongo and static assets off the box respectively.
  What's left after those — redundant app-server instances behind a load
  balancer — has no trigger yet besides observed resource pressure (via
  #11's monitoring) or downtime actually costing something (real users,
  an SLA). Not worth planning further until one of those is true.
- **No staging environment.** A real staging environment roughly doubles
  the infrastructure (another server, another Mongo instance, its own
  deploy pipeline), which isn't justified at zero-traffic solo-dev scale.
  Trigger: real users who'd be affected by a bad deploy, or deploys
  becoming risky enough (schema migrations, breaking API changes) that
  local prod-shape testing (see [README.md](README.md#testing-the-production-shape-locally))
  stops being sufficient confidence.
