# Definition of Done

An issue is **Done** only when every applicable item below is true. Consult
this list before closing any issue. "Applicable" matters: a docs-only change
has no new tests to write, and a change with no runtime surface has nothing to
drive — but the default is that an item applies, and skipping one is a
decision you should be able to justify in the PR.

This is the bar for *closing an issue*, not merely for opening a PR. Several
items (deploy health, live verification) can only be satisfied after merge to
`main`, so "Done" for a deploy-affecting change extends past the merge button.

## Checklist

- [ ] **Builds successfully.** All three Docker images build (`docker compose
      -f docker-compose.yaml build`). Both compose shapes are considered —
      dev (`docker compose up`, override auto-applied) and prod
      (`-f docker-compose.yaml`) diverge and have bitten us before, so
      anything touching `server/`, `nginx/`, or compose exercises both.
- [ ] **All relevant tests pass.** `cd server && npm test` and
      `cd client && npm test`.
- [ ] **New behavior is covered by automated tests.** Untested `src/` files
      can't hide by never being imported — every `src/` file counts toward
      coverage. Deliberate exclusions (side-effect-only entry points) must be
      documented in the vitest/vite config.
- [ ] **Failure cases are tested where appropriate.** Not just the happy
      path — the degraded/error branch too (e.g. the health endpoint's 503
      path, not only its 200).
- [ ] **CI/CD passes.** All required checks green on the PR: `test`, `build`,
      `lint`, and `dependency-gate`.
- [ ] **Coverage gate respected.** `npm run test:coverage` passes; if coverage
      grew, ratchet the thresholds **up** in `server/vitest.config.js` /
      `client/vite.config.js`. Never lower a threshold to make a red PR green.
- [ ] **Documentation updated if behavior changed.**
      - `README.md` — if user-facing behavior changed.
      - `ARCHITECTURE.md` — if architectural behavior/structure changed.
      - `DEPLOY.md` — if the deploy pipeline, server setup, or ops changed.
      - An **ADR** (`docs/adr/NNNN-title.md`) — if a long-term design
        decision was made.
- [ ] **GitHub issue and PR updated.** Issue reflects the final outcome; PR
      body has What / Why / Validation / Remaining. Related PRs linked.
- [ ] **No new warnings or lint failures introduced.** The `lint` check runs
      ESLint (`npm run lint`, `--max-warnings=0`) and Prettier
      (`npm run format:check`) for both packages; both must be clean.
- [ ] **Architectural constraints validated**, including the **dependency
      gate**: if this PR closes an issue with "Blocked by" links, every
      blocker is already closed (the `dependency-gate` check enforces this).
- [ ] **Empirical verification done — do not trust a green checkmark.** Drive
      the real surface: hit the endpoint, watch the deploy run to green,
      re-check the live site, read the real logs/dashboard. For a
      security/monitoring/logging control, prove it *live* (send a fake
      secret and grep for it; throw a real error and confirm it arrives). A
      control unproven is a control unclaimed. A promised-but-absent result
      is a finding to investigate, not noise.
- [ ] **Discovered technical debt is documented.** File a well-formed issue
      (assigned, labeled, milestoned or explicitly trigger-gated) rather than
      leaving it in conversation.

## On closing the issue

When an issue is completed, also:
1. Update the GitHub issue (final state, outcome).
2. Update milestone progress (the issue closing advances it automatically;
   confirm it landed in the right milestone).
3. Update `ARCHITECTURE.md` if architectural behavior changed.
4. Update `README.md` if user-facing behavior changed.
5. Create/update an ADR (`docs/adr/`) if a long-term design decision was made.
6. Update `docs/PROJECT_STATE.md` **only if durable orientation changed** — its
   knowledge-map, the phase model, or a working agreement. Most issues won't
   touch it; live status (issues, PRs, milestones, CI, deploys) is owned by
   GitHub, never mirrored there.
7. At the end of the session, **regenerate `docs/SESSION_HANDOFF.md`** (see
   CONTRIBUTING → "Start and end of every session"): the transient record of
   what this session did, what's left, and the recommended next task.
