# 1. Split project knowledge by rate of change; GitHub owns dynamic state

- Status: accepted
- Date: 2026-07-15
- Issue: #83

## Context

`docs/PROJECT_STATE.md` was introduced (#74) as a "living snapshot" that a fresh
session could read to reconstruct the project. In practice it went stale
repeatedly, because it committed two kinds of fast-moving information into a
file that only changes through a reviewed PR:

1. **State GitHub already owns** — open issues, PR status, milestone counts, CI
   and deploy results. A committed file can only ever lag these live systems.
2. **Session-scoped state** — "current branch", "active PR", "next task" — which
   is meaningless to the *next* session and often describes the very PR that is
   editing it (the #79 close-out literally described itself as unmerged).

A document that advertises itself as a live dashboard is wrong the moment
anything moves. The root problem is not the content but the *mixing of rates of
change* in one committed artifact.

## Decision

Allocate project knowledge by **who owns it and how fast it changes**:

- **GitHub is the single source of truth for all dynamic state** — Issues (work
  items and their status), Pull Requests (change records + checks), Milestones
  (roadmap progress), Actions (CI + deploy results). No committed prose mirrors
  these.
- **`PROJECT_STATE.md` becomes durable orientation only** — a knowledge-map of
  where each kind of information lives, the phase model as a concept, durable
  working agreements, and new-session bootstrap steps. It is a map, not a
  dashboard, and is edited only when long-lived context changes.
- **`SESSION_HANDOFF.md` (new) carries the transient thread** — the single most
  recent session's completed / remaining / blockers / validation / gotchas /
  next-task. It is regenerated every session and read at the start of the next.
  It links to GitHub rather than restating it, and is explicitly a point-in-time
  snapshot that a new session reconciles against GitHub before acting.
- **`ARCHITECTURE.md` and ADRs** hold durable design and point-in-time decisions
  (this file is the first ADR).
- **Claude memory** holds timeless user preferences and working style, outside
  the repo.

`SESSION_HANDOFF.md` is **local and gitignored**, not committed — it is a
per-working-copy scratchpad, updated in place at session end with no commit, PR,
or deploy. A new session on the same working copy reads it directly; fresh-clone
and cloud sessions simply reconstruct from GitHub + the durable docs + Claude
memory without it (the handoff is a convenience, not a sole source). This was
revised from an initial "committed" design in #85: committing it reintroduced a
small version of the very churn this ADR set out to remove (a docs-only PR per
no-code session, and a `main` copy that lags the last unmerged session).

## Consequences

- PROJECT_STATE stops going stale, because it no longer holds anything that
  moves faster than the project's fundamental shape.
- Staleness stops being a failure mode for the handoff too: it is honestly
  labeled "as of last session" and defers to GitHub, so being historical is
  expected rather than wrong.
- Duplication is minimized: each fact has exactly one authoritative home.
- No churn: because the handoff is local/gitignored, updating it costs nothing
  (no commit, PR, or deploy) and it can never go stale on `main`.
- Cost: the handoff is not visible on GitHub and does not survive a fresh clone
  or reach a cloud session. Accepted deliberately — those sessions reconstruct
  from GitHub + the durable repo docs + Claude memory, and the handoff is a
  same-working-copy convenience rather than a reconstruction source of record.
