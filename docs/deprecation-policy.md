# Deprecation Policy and Migration Notes

Status: Draft  
Last updated: 2026-02-07

## Policy

- Deprecated behavior is announced in release notes before removal.
- Deprecated behavior remains available for at least one minor release unless a critical security issue requires immediate removal.
- Breaking removals occur only in a major release, except emergency security fixes.

## Deprecation Notice Format

Each deprecation notice should include:

- What is deprecated.
- Replacement path.
- First version where deprecation appears.
- Earliest removal version.
- Migration steps.

## Migration Notes Template

Use this template in release notes:

```
### Migration: <feature/change>
Affected versions: <from -> to>
Why changed: <reason>
Action required:
1. ...
2. ...
Compatibility flags/options:
- ...
Rollback guidance:
- ...
```

## Current Notable Compatibility Switches

- `allowLegacySchemaHash`:
  - `true` (default): accepts legacy schema hash fallback.
  - `false`: strict new schema hash only.
