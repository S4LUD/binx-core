# Branch Protection and Required Checks

Status: Actionable (manual repo-admin step)  
Last updated: 2026-02-07

## Target Branch

- `main`

## Required Protections

Enable the following repository settings for `main`:

1. Require a pull request before merging.
2. Require at least 1 approving review.
3. Dismiss stale approvals on new commits.
4. Require conversation resolution before merging.
5. Require status checks to pass before merging.
6. Restrict who can push directly (optional but recommended).
7. Require linear history (recommended).

## Required Status Checks

Mark these checks as required:

- `build-and-test` (from `.github/workflows/ci.yml`)
- `dependency-audit` (from `.github/workflows/security.yml`)
- `secret-scan` (from `.github/workflows/security.yml`)

## Optional Stronger Controls

- Require signed commits.
- Require deployments to succeed before merging.
- Require merge queue.

## Verification

After configuration:

1. Open a test PR with one failing check.
2. Confirm merge is blocked.
3. Re-run with all checks passing.
4. Confirm merge is allowed only with required review(s).

## CLI Apply (optional)

If GitHub CLI auth is configured with repo-admin rights:

```bash
pwsh -File scripts/configure-branch-protection.ps1 -Owner S4LUD -Repo binx-core -Branch main
```
