# Release and Provenance Process

Status: Draft  
Last updated: 2026-02-07

## Automation

- `release-please` workflow proposes release PRs and changelog updates.
- `publish` workflow publishes to npm on GitHub release publication.
- Publish step uses `npm publish --provenance --access public`.

## Required Repository Configuration

- `NPM_TOKEN` secret configured for npm publish.
- Actions workflow permissions allow write access and PR creation:
  - Settings > Actions > General > Workflow permissions: `Read and write permissions`
  - Settings > Actions > General > enable `Allow GitHub Actions to create and approve pull requests`
- Optional fallback: `RELEASE_PLEASE_TOKEN` (PAT with `repo` scope) for release-please if org/repo policy restricts default `GITHUB_TOKEN`.
- Protected `main` branch with required CI checks.
- Maintainers review and merge release PRs.

## Release Flow

1. Merge normal PRs with conventional commit messages where possible.
2. `release-please` opens/updates a release PR with changelog.
3. Merge release PR to create a GitHub release/tag.
4. `publish` workflow builds and publishes package with provenance.

## Manual Rollback

- If publish fails, fix issue and re-run publish workflow from release.
- If bad release is published, deprecate package version and publish patched release.
