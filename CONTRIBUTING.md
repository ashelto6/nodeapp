# Workflow

All changes go through an issue branch and a reviewed pull request — `main`
is protected and cannot be pushed to directly.

1. Open (or pick) a GitHub Issue describing the change.
2. Branch off `main`, named `<issue-number>-short-description`:
   ```bash
   git checkout -b 12-fix-nginx-config main
   ```
3. Commit your work and push the branch:
   ```bash
   git push -u origin 12-fix-nginx-config
   ```
4. Open a pull request into `main`. Three required status checks gate the
   merge: `test` (both Vitest suites with their coverage thresholds),
   `build` (all three Docker images), and `dependency-gate` (see below).
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
