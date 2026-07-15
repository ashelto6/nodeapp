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

**Phase 3: Quick Wins** — cheap, independent hardening (11 closed / 11 open;
#76 fully closed with both deploy-contract paths proven live). Next milestone
queued: **Phase 4: Reliability** (0 closed / 2 open — #12 Mongo backups, #18
incident runbook).

Phases 1 (Foundation) and 2 (Observability) are complete and audited.

## Current branch

`80-refresh-project-state` (this docs-only housekeeping change, correcting the
stale self-referential state left by the #79 close-out). `main` is at merge
commit `743bdbd` (PR #79, the #76 skip-path verification).

## Active pull requests

- **This PROJECT_STATE refresh PR (#80).** Docs-only; corrects state that went
  stale when the self-referential #79 close-out merged. Being docs-only, its
  merge must produce **no** deploy run (another skip-path datapoint). Awaiting
  the owner's manual merge.
- (No other PRs open.)

## CI/CD status

- `main` branch protection required checks: **`build`, `test`,
  `dependency-gate`** (`strict: true`, `enforce_admins: true`). The dependency
  gate is binding as of 2026-07-15.
- Last deploy: run 29398196956 (sha `584b464`, the #77 merge) — **success**,
  health gate green. That merge touched `deploy.yml` (an allowlisted path), so
  it correctly deployed — the empirical proof of the #76 "runtime path → still
  deploys" contract.
- **Skip path now proven live too.** The subsequent docs-only merge `743bdbd`
  (PR #79) produced **no** deploy run — the last deploy remains 584b464. Both
  halves of the #76 path-filter contract are therefore confirmed empirically.

## Current implementation progress

- **#70 dependency-gate — DONE & merged (PR #71).** Proven live pass→fail→pass
  (runs 29383032695 / 29396015571 / 29396121488), added to `main` branch
  protection required checks, merged, deployed, live-health-checked.
- **#74 process docs — DONE & merged (PR #75).** `DEFINITION_OF_DONE.md` +
  `PROJECT_STATE.md` now on `main`; `CONTRIBUTING.md` references them.
- **#76 deploy path filter — DONE & merged (PRs #77 + #79).** `paths:`
  allowlist on the deploy trigger so only runtime changes redeploy. **Both
  contract paths proven live:** deploy path (run 29398196956, sha 584b464) and
  skip path (docs-only merge 743bdbd produced no deploy run).
- **#78 filed** — bump GitHub Actions off deprecated Node 20 runners (infra,
  Phase 3), surfaced by the #77 deploy run's annotations.
- **#80 filed** — this PROJECT_STATE refresh (documentation, unscheduled).

## Known blockers

None.

## Technical debt / open hardening (Phase 3 unless noted)

- #69 Harden SSH key posture (separate deploy key, passphrase human key) — security
- #78 Bump GitHub Actions off deprecated Node 20 runners — infra
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

1. **#64 (ESLint + Prettier gate) — do first.** It unblocks the "no new lint
   failures" DoD item for every subsequent Phase 3 change, so it pays off most
   when done early in the phase.
2. **#29 (Vite proxy changeOrigin + graceful shutdown + `Sentry.flush()`).**
   Not just hygiene — a *demonstrated* defect: on every deploy the container
   gets SIGTERM without flushing Sentry, so errors during a rollout (the most
   diagnostically valuable kind) are silently lost.
3. Remaining Phase 3, cheap → higher-value: #47 (license field — trivial),
   #68 (gzip), #78 (Node 20 runner bump), then security: #14 (helmet),
   #67 (least-privilege Mongo user), #69 (SSH posture).

## Process / workflow

- Workflow: `CONTRIBUTING.md`. Definition of Done: `docs/DEFINITION_OF_DONE.md`.
- Every issue carries Objective / Acceptance Criteria / Implementation Notes /
  Edge Cases / related PR links. Every PR carries What / Why / logs-or-shots /
  Remaining work / Validation.
- Merges to `main` are performed manually by the owner (never automated).
- ADRs live in `docs/adr/` (create as long-term design decisions are made;
  none written yet).
