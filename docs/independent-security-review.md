# Independent Security Review Plan

Status: Ready for execution (external)  
Last updated: 2026-02-07

## Objective

Obtain an external, independent review of protocol and implementation security for `binx-core`.

## Scope

In scope:

- `src/crypto/*`
- `src/serialization/*`
- `src/internal/*`
- Protocol docs and compatibility behavior
- CI security controls and release provenance flow

Out of scope:

- Host hardening for downstream deployments
- Consumer service business logic

## Review Deliverables

1. Findings report with severity ratings.
2. Reproduction steps for each finding.
3. Recommended remediations.
4. Final sign-off letter after fixes.

## Reviewer Requirements

- Not affiliated with this codebase implementation.
- Demonstrated cryptography/appsec review experience.
- Ability to disclose methodology and assumptions.

## Execution Checklist

- [ ] Select reviewer and confirm independence.
- [ ] Share review package:
  - `docs/protocol.md`
  - `docs/threat-model.md`
  - `docs/key-lifecycle-policy.md`
  - `docs/compatibility-policy.md`
  - `docs/deprecation-policy.md`
  - `SECURITY.md`
- [ ] Provide exact commit/tag under review.
- [ ] Receive findings report.
- [ ] Triage and fix all critical/high findings.
- [ ] Re-review fixed areas.
- [ ] Archive final sign-off in repository docs.

## Findings SLA

- Critical: fix before release.
- High: fix before release or block production rollout.
- Medium: scheduled remediation within one release cycle.
- Low: backlog with justification.

## Sign-Off Record Template

```
Reviewer:
Organization:
Review date:
Commit/tag reviewed:
Critical findings open: 0
High findings open: 0
Overall decision: PASS / PASS WITH CONDITIONS / FAIL
Notes:
```
