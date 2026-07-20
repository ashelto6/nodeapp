# 6. Run headless browser rendering as its own Compose service

- Status: accepted
- Date: 2026-07-20
- Issue: n/a (product architecture session)

## Context

Screening requires rendering real pages: Lighthouse needs a browser, axe-core
runs against a live DOM, screenshots are evidence, and many small-business sites
render their actual content via JavaScript so a plain HTTP fetch sees nothing
useful.

That means Playwright or Puppeteer with a bundled Chromium. The resource profile
is nothing like the JSON API's: roughly a gigabyte of image, hundreds of
megabytes of RAM per browser instance, and a genuine tendency to hang, leak, and
crash on hostile or malformed pages — which is precisely the population being
analyzed.

The existing architecture deliberately keeps services separated, and the
existing prod compose stack has a health-gated deploy contract on
`/api/health`. A browser crash or memory exhaustion inside the API container
would take the API process with it, fail the health check, and — during a
deploy — fail the deploy gate. The failure of an untrusted third-party page
would become an outage of the whole application.

## Decision

Render in a dedicated `browser` Compose service.

- Its own image with Playwright and Chromium, separate from the server image
- An explicit concurrency limit on simultaneous browser contexts
- Hard per-page timeouts, with pages treated as hostile input
- A memory limit and `restart: unless-stopped`, so a crash is a contained
  restart rather than a cascading failure
- Its own healthcheck, and no `depends_on` relationship that would let it block
  nginx or the API from starting

The API and worker call it over the internal Compose network. It is the only
component permitted to execute untrusted page JavaScript.

## Alternatives considered

**Playwright inside the server container.** One less service. Rejected: it
couples the stability of the public API to arbitrary third-party page
execution, and it triples the server image size for a capability the API itself
never uses. The deploy health gate makes this materially worse than it would be
in a system without one.

**Playwright inside the worker container.** More defensible, since the worker is
already the thing doing the analysis, and it avoids a network hop. Rejected
mainly on resource isolation: the worker also makes LLM calls and writes
results, and a browser OOM would lose that in-flight work. Worth revisiting if
the extra service proves to be more operational overhead than it is worth — this
is the closest alternative.

**A hosted rendering API (Browserless, ScrapingBee, or similar).** No
infrastructure to run, handles scaling and blocking. Rejected for now on cost at
volume and on the loss of control over exactly what the page saw. Genuinely
worth reconsidering if self-hosted rendering turns into an ongoing operational
burden, and worth pricing before committing significant time to hardening the
self-hosted path.

## Consequences

- A browser crash or hang is contained and does not affect the API, the health
  endpoint, or the deploy gate.
- The rendering tier can be scaled or resource-limited independently of the API.
- **The single Linode box may not have headroom for this.** Chromium plus
  MongoDB plus the app on one instance is the most likely reason a resize
  becomes necessary, and this should be checked against actual instance
  resources before the service is built rather than discovered under load.
- Cost: another service to build, monitor, and keep updated. Chromium is a
  frequent source of security advisories and will need regular rebuilding.
- Cost: an internal network hop and a serialization boundary for page artifacts.
  Negligible relative to page load time.
- Untrusted JavaScript execution is now isolated to one container, which is also
  the right shape for tightening it later (dropped capabilities, seccomp, no
  network access beyond the target) if that becomes warranted.
