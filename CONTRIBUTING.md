# Workflow

All changes go through an issue branch and a reviewed pull request — `main`
is protected and cannot be pushed to directly.

## Where state lives

**GitHub is the single source of truth for all dynamic state** — Issues (work
items and their status), Pull Requests (change records + checks), Milestones
(roadmap progress), and Actions (CI + deploy results). Committed docs never
mirror these; they hold only durable or transient *context*, split by how fast
it changes:

- [docs/PROJECT_STATE.md](docs/PROJECT_STATE.md) — **durable** orientation: the
  map of where every kind of knowledge lives, the phase model, and new-session
  bootstrap steps. Edited only when long-lived context changes.
- [docs/SESSION_HANDOFF.md](docs/SESSION_HANDOFF.md) — **transient** thread:
  what the last session did, what's left, blockers, validation, and the
  recommended next task. Regenerated every session, read at the start of the
  next.
- [docs/DEFINITION_OF_DONE.md](docs/DEFINITION_OF_DONE.md) — the checklist
  consulted before closing any issue.
- [docs/adr/](docs/adr/) — point-in-time records of long-term decisions.

The rationale for this split is
[ADR-0001](docs/adr/0001-project-state-workflow.md).

## Start and end of every session

- **At the start:** read `docs/PROJECT_STATE.md` (orientation) and
  `docs/SESSION_HANDOFF.md` (where the last session left off), then reconcile
  anything dynamic against GitHub — it wins over any prose.
- **At the end:** **regenerate `docs/SESSION_HANDOFF.md`** for the work just
  done (it rides in the session's PR; a session with no code change opens a
  small docs-only PR, which skips the deploy). Touch `PROJECT_STATE.md`,
  `ARCHITECTURE.md`, or an ADR **only if durable knowledge actually changed** —
  routine work should not churn them.

1. Open (or pick) a GitHub Issue describing the change.
2. Branch off `main`, named `<issue-number>-short-description`:
   ```bash
   git checkout -b 12-fix-nginx-config main
   ```
3. Commit your work and push the branch:
   ```bash
   git push -u origin 12-fix-nginx-config
   ```
4. Open a pull request into `main`. Required status checks gate the merge:
   `test` (both Vitest suites with their coverage thresholds), `build` (all
   three Docker images), `lint` (ESLint + Prettier for both packages), and
   `dependency-gate` (see below).
5. Review the diff on GitHub, then merge. Merging into `main` automatically
   triggers `.github/workflows/deploy.yml`, which builds, pushes to GHCR,
   deploys to the Linode server, and health-checks the result.
6. Delete the branch after merge (GitHub can do this automatically on
   merge — enable it in repo settings if not already on).

## Issue dependencies

When an issue genuinely cannot be worked/finished until another issue
lands, record that with GitHub's native **"Blocked by"** link on the
issue (sidebar → Relationships), not just prose in the body. Two things
follow from it:

- **It's enforced, not advisory**: the `dependency-gate` required check
  fails any PR that closes an issue whose blockers are still open, so a
  dependent change cannot merge ahead of its dependency — regardless of
  who (or what) opened the PR.
- **Re-run after unblocking**: a blocker closing does *not* auto-re-run
  the blocked PR's failed check. Re-run it from the PR's Checks tab (or
  push a commit) once the blocker has landed.

Use "Blocked by" only for real issue→issue dependencies. Parent/child
decomposition uses **sub-issues** instead, and work gated on an external
condition (a domain existing, real data, a second contributor) is
tracked as a written trigger in the issue body — there's no issue to
link to.
