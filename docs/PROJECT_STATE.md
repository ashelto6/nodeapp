# Project State

> Living snapshot of the project so a fresh session (human or agent) can
> continue with minimal reliance on conversation history. Keep it current;
> update it at the end of every session and whenever state materially changes.
>
> **Authoritative sources of truth are GitHub and the repository**, not this
> file — when they disagree, GitHub/the repo win and this file is stale and
> should be corrected.

_Last updated: 2026-07-15_

## Current milestone

**Phase 3: Quick Wins** — cheap, independent hardening (10 closed / 11 open;
#70 and #74 now merged, #76 in progress). Next milestone queued: **Phase 4:
Reliability** (0 closed / 2 open — #12 Mongo backups, #18 incident runbook).

Phases 1 (Foundation) and 2 (Observability) are complete and audited.

## Current branch

`76-deploy-path-filter` (adds a runtime-path allowlist to the deploy trigger).
`main` is at merge commit `8e446b2` (PR #75, the engineering process docs).

## Active pull requests

- **PR #77 — #76 deploy path filter.** Adds a `paths:` allowlist to
  `deploy.yml` so only runtime changes redeploy. All three required checks
  green; open, awaiting the owner's manual merge. Post-merge live verification
  (docs-only push → no run; server change → deploys + health-checks) is the
  remaining Definition-of-Done item.
- (No other PRs open.)

## CI/CD status

- `main` branch protection required checks: **`build`, `test`,
  `dependency-gate`** (`strict: true`, `enforce_admins: true`). The dependency
  gate is binding as of 2026-07-15.
- Last deploy: run 29396900680 (sha `8e446b22`, the docs-only #75 merge) —
  **success**. Note this run is itself the motivating case for #76: a
  Markdown-only merge triggered a full rebuild + redeploy.

## Current implementation progress

- **#70 dependency-gate — DONE & merged (PR #71).** Proven live pass→fail→pass
  (runs 29383032695 / 29396015571 / 29396121488), added to `main` branch
  protection required checks, merged, deployed, live-health-checked.
- **#74 process docs — DONE & merged (PR #75).** `DEFINITION_OF_DONE.md` +
  `PROJECT_STATE.md` now on `main`; `CONTRIBUTING.md` references them.
- **#76 deploy path filter — in progress** (this branch, PR #77). `paths:`
  allowlist added to `deploy.yml`; required checks green; awaiting merge +
  post-merge live verification.

## Known blockers

None.

## Technical debt / open hardening (Phase 3 unless noted)

- #69 Harden SSH key posture (separate deploy key, passphrase human key) — security
- #68 Enable gzip compression at nginx — infra
- #67 App connects to MongoDB as root admin; needs least-privilege user — security
- #64 Add ESLint + Prettier with a CI gate — architecture
- #53 Configure Docker log rotation on the server (json-file unbounded) — reliability
- #47 package.json `license` says MIT, contradicts PolyForm LICENSE — bug
- #29 Vite proxy changeOrigin + server graceful shutdown — infra
- #16 Parameterize hardcoded image owner (ashelto6) in compose — infra
- #14 Add helmet security headers to Express — security
- #13 Add dependency vulnerability scanning to CI — security
- Phase 4: #18 incident runbook, #12 Mongo backup strategy
- Unscheduled / trigger-gated: #22 ufw-docker, #15 per-feature docs/ structure,
  #7 Mongo→Atlas, #6 static hosting→CDN

## Recent architectural changes

- **Issue dependencies are now merge-enforced (#70/#71).** A `dependency-gate`
  required check fails any PR that closes an issue whose "Blocked by" blockers
  are still open. Proven on both paths and wired into branch protection.
- Phase 2 observability landed and hardened: UptimeRobot monitor (#34),
  Sentry error tracking (#35), structured pino request/error logging (#36),
  post-deploy health gate with `/api/health` status code as the contract
  (#52). Post-phase hardening audit merged (#62).
- Phase 1 foundation: MERN restructure, server ESM (#49), server layering
  (#37), client structure (#38), error middleware (#39), input validation
  (#40), coverage gate (#17), README refresh (#65).

## Next recommended engineering tasks

1. Merge #76 (deploy path filter, PR #77) — owner action — then the
   post-merge live verification of the skip/deploy paths.
2. Resume Phase 3. Cheap independent wins: #47 (license field — trivial),
   #29 (proxy/shutdown), #68 (gzip). Higher-value security: #14 (helmet),
   #67 (least-privilege Mongo user), #69 (SSH posture).
3. #64 (ESLint + Prettier gate) unblocks the "no new lint failures" DoD item
   for everything after it — worth doing early in the phase.

## Process / workflow

- Workflow: `CONTRIBUTING.md`. Definition of Done: `docs/DEFINITION_OF_DONE.md`.
- Every issue carries Objective / Acceptance Criteria / Implementation Notes /
  Edge Cases / related PR links. Every PR carries What / Why / logs-or-shots /
  Remaining work / Validation.
- Merges to `main` are performed manually by the owner (never automated).
- ADRs live in `docs/adr/` (create as long-term design decisions are made;
  none written yet).
