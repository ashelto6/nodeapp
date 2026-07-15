# Session Handoff

> **Transient working thread — the single most-recent session only.** This file
> is fully **regenerated at the end of every session** and **read at the start
> of the next one**. It is the counterpart to the durable
> [PROJECT_STATE.md](PROJECT_STATE.md): that file holds long-lived orientation,
> this one holds "where I just left off."
>
> **It is a point-in-time snapshot, not a live dashboard.** Everything dynamic
> it mentions (issues, PRs, CI, deploys) is authoritatively owned by GitHub —
> the entries here are pointers and narrative context, and a new session must
> **reconcile against GitHub before acting**. Being "as of last session" is
> expected, not a bug: this file is never wrong, only historical.
>
> Sections to regenerate each session: Session / Completed / In flight /
> Blockers / Validation / Notes & gotchas / Recommended next.

---

_Session: 2026-07-15_

## Completed this session

- **#80 / PR #81 — PROJECT_STATE refresh (merged).** Corrected stale
  self-referential state left by the #79 close-out; recorded the #76 deploy
  path-filter *skip* path as empirically proven (the docs-only merge `743bdbd`
  produced no deploy run).
- **#64 / PR #82 — ESLint + Prettier CI lint gate (merged, deployed green).**
  Flat-config ESLint 9 + Prettier for both packages, a `lint` CI job
  (`--max-warnings=0`), per-package formatting (server 4-space, client 2-space).
  Post-merge deploy `a25291a` succeeded.
- **#83 / this PR — state-tracking workflow redesign (in progress).** Split
  project knowledge by rate of change: durable PROJECT_STATE (orientation +
  knowledge-map), transient SESSION_HANDOFF (this file), ADR-0001 for the
  decision, plus CONTRIBUTING / DoD / memory updates.

## In flight / remaining

- **This PR (#83)** is open and awaiting the owner's review + manual merge.
- Nothing else is mid-implementation.

## Blockers

- None.

## Owner actions outstanding (not something an agent can do)

- **Add `lint` to `main` branch protection.** Carried over from #64: the `lint`
  check runs on PRs but is *not yet* a required check — branch protection still
  lists only `build` / `test` / `dependency-gate` (verified via the API this
  session). Until added, the lint gate is advisory, not binding.

## Validation performed this session

- #64: `npm run lint` + `format:check` green locally for both packages; the
  `test` / `build` / `lint` / `dependency-gate` checks all passed on PR #82;
  post-merge deploy run `a25291a` completed successfully.
- **Not** locally verifiable: the Vitest suites. This dev box is Node 18.19 and
  Vitest 4 requires Node 20+ (it imports `node:util`'s `styleText`), so tests
  are CI-verified only. ESLint 9 / Prettier 3 *do* run on Node 18.
- #83 (this PR): docs-only, so it must produce **no** deploy on merge (another
  skip-path datapoint) — confirm from the deploy run history after merge.

## Notes & gotchas

- **Tests only run in CI on this machine** (Node 18 vs Vitest 4 — see above).
  Don't claim a local test pass here; watch the CI `test` job instead.
- **`gh issue view` fails** on this repo with a Projects-classic deprecation
  error; use `gh issue view N --json …` instead.
- Working directory does not persist reliably between separate Bash calls for
  `cd`; prefer absolute paths or `cd` at the start of each command.

## Recommended next task

1. **Owner:** add `lint` to branch protection (above).
2. **Engineering: #29** (Vite proxy `changeOrigin` + graceful shutdown +
   `Sentry.flush()`). Not hygiene — a *demonstrated* defect: on every deploy the
   container gets SIGTERM without flushing Sentry, so errors during a rollout
   (the most diagnostically valuable kind) are silently lost. Top Phase 3 pick.
   Other cheap Phase 3 wins after it: #47 (license field), #68 (gzip), #78
   (Node-20 runner bump).
