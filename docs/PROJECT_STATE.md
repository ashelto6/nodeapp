# Project State

> **Orientation doc for a new session (human or agent).** Read this first to
> learn *what this project is* and *where each kind of knowledge lives*. It is
> deliberately **durable** — it holds only long-lived context, never live
> status — so it does not go stale between sessions.
>
> **GitHub is the single source of truth for all dynamic state**: open work,
> change records, roadmap progress, and CI/deploy results. This file mirrors
> none of that. When prose here disagrees with GitHub or the code, GitHub and
> the code win.
>
> For *where the last session left off*, read
> [SESSION_HANDOFF.md](SESSION_HANDOFF.md) — that is the transient companion to
> this durable file, regenerated every session.

## What this project is

nodeapp is a MERN (MongoDB, Express, React, Node) app behind nginx, deployed to
a Linode server via GitHub Actions. To **run or develop** it, see the
[README](../README.md); for **architecture and design rationale**, see
[ARCHITECTURE.md](../ARCHITECTURE.md). This file is neither of those — it is the
map that tells a new session where to look for everything else.

## Where knowledge lives (the map)

Nothing dynamic is tracked in committed prose. A new session reconstructs the
current state by consulting the systems below — never by trusting a checked-in
status file.

| Question | Authoritative source |
| --- | --- |
| What work is planned / in progress / done? | **GitHub Issues** — open = to-do or in progress, closed = done. Each carries Objective / Acceptance Criteria / Implementation Notes / Edge Cases / `Blocked by`. |
| What did a specific change do, and did it pass review/CI? | **GitHub Pull Requests** and their checks. Each PR body has What / Why / Validation / Remaining. |
| What's the roadmap, and how far along is each phase? | **GitHub Milestones** — live open/closed counts per phase. |
| Did CI pass? Did the last deploy go green? | **GitHub Actions** — the `test` / `build` / `lint` / `dependency-gate` checks, and the deploy workflow's run history. |
| How is the system built, and why these choices? | [ARCHITECTURE.md](../ARCHITECTURE.md), plus the decision records in [adr/](adr/). |
| How do I run, develop, and test it? | [README.md](../README.md). |
| How do I take a change from issue → branch → PR → merge? | [CONTRIBUTING.md](../CONTRIBUTING.md). |
| When is an issue actually *done*? | [DEFINITION_OF_DONE.md](DEFINITION_OF_DONE.md). |
| Where did the last session leave off, and what's next? | [SESSION_HANDOFF.md](SESSION_HANDOFF.md) — transient, regenerated each session. |
| What are the user's durable preferences and how should I work? | Claude memory — persists across sessions, lives outside the repo. |

## The phase model

Work is grouped into sequential **milestones** ("phases"), each a themed batch
of largely independent issues, audited before the next begins. The lineage so
far runs Foundation → Observability → Quick Wins → Reliability → … This is the
*shape* of the roadmap; for **which phase is current and its live progress, see
GitHub Milestones** — those counts are deliberately not copied here, because
that is exactly the kind of duplication that goes stale.

## Durable working agreements

Long-lived conventions that aren't obvious from the code and rarely change. The
authoritative detail lives in CONTRIBUTING / the Definition of Done; this is the
orientation summary.

- **`main` is protected; merges are performed manually by the owner** — never
  automated, never by an agent. Prepare PRs fully merge-ready; the owner clicks
  merge.
- **Merging to `main` deploys.** `deploy.yml` runs on push to `main`, gated by a
  `paths:` allowlist so only runtime changes (`server/`, `client/`, `nginx/`,
  compose) redeploy — docs-only changes skip it. A post-deploy health gate on
  `/api/health` is the success contract.
- **Issue dependencies are merge-enforced.** The `dependency-gate` check fails
  any PR that closes an issue whose GitHub "Blocked by" links are still open.
- **Verify empirically.** "Done" means the behavior was observed on the real
  surface (endpoint hit, deploy watched to green, logs/dashboard read) — not
  that a checkmark went green. See the Definition of Done.
- **Every issue and PR follows the standard section templates** (see
  CONTRIBUTING and the PR template).

## Bootstrapping a new session

1. Read this file — orientation and the knowledge-map above.
2. Read [SESSION_HANDOFF.md](SESSION_HANDOFF.md) for where the last session left
   off and the recommended next task.
3. Reconcile anything dynamic against GitHub (open issues, PR/CI status,
   milestone progress). GitHub wins over any prose, here or in the handoff.
4. Recall Claude memory for the user's durable preferences and working style.
