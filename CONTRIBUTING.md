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
4. Open a pull request into `main`. The `CI` workflow builds both Docker
   images and must pass before merging.
5. Review the diff on GitHub, then merge. Merging into `main` automatically
   triggers `.github/workflows/deploy.yml`, which builds, pushes to GHCR,
   and deploys to the Linode server.
6. Delete the branch after merge (GitHub can do this automatically on
   merge — enable it in repo settings if not already on).
