# Compatibility Policy

Status: Draft  
Last updated: 2026-02-07

## Versioning

`binx-core` follows Semantic Versioning for package releases.

- `MAJOR`: incompatible API changes or wire-format changes.
- `MINOR`: backward-compatible features.
- `PATCH`: backward-compatible fixes.

## Wire-Format Guarantees

- Serialized/encrypted payload compatibility is tied to protocol `VERSION`.
- Incompatible wire changes require a protocol version bump.
- Within the same major package version, decode support for documented legacy formats may be retained.

## Backward Compatibility Scope

- Public API from `src/index.ts` is the supported surface.
- Internal modules (`src/internal/*`, non-exported paths) are not stable contracts.
- Legacy schema hash fallback is supported by default and can be disabled with `allowLegacySchemaHash: false`.

## Change Management

Before shipping a compatibility-impacting change:

1. Update `docs/protocol.md`.
2. Add/adjust compatibility tests.
3. Document migration in release notes.
4. If breaking, bump major version.
