param(
  [string]$Owner = "S4LUD",
  [string]$Repo = "binx-core",
  [string]$Branch = "main"
)

$body = @"
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["build-and-test", "dependency-audit", "secret-scan"]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "required_approving_review_count": 1,
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": false
  },
  "restrictions": null,
  "required_linear_history": true,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "block_creations": false,
  "required_conversation_resolution": true
}
"@

$body | gh api `
  -X PUT `
  "repos/$Owner/$Repo/branches/$Branch/protection" `
  -H "Accept: application/vnd.github+json" `
  --input -
