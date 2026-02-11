# Binx-Core Production Readiness Checklist

Use this checklist before claiming industry-grade production readiness.

## 1) Security and Cryptography (Blocker)

- [ ] Write a protocol spec (`docs/protocol.md`) with byte layout, versioning, tag meanings, and compatibility rules.
- [ ] Document a threat model (`docs/threat-model.md`): what attacks are in-scope and out-of-scope.
- [ ] Define key lifecycle policy: generation, rotation, storage, revocation, incident response.
- [ ] Add strict KID validation (`0-255`) and reject invalid values in encrypt/decrypt paths.
- [ ] Add authenticated metadata strategy (if needed) via AAD and document its use.
- [ ] Add limits to prevent resource abuse (max payload size, max nested depth, max string length).
- [ ] Run an independent cryptography/security review before production rollout.

## 2) Correctness and Reliability (Blocker)

- [ ] Add comprehensive unit tests for serialization tags and round-trip behavior.
- [ ] Add negative tests for malformed/truncated/corrupted ciphertext and payloads.
- [ ] Add compatibility tests for legacy hash fallback and strict mode behavior.
- [ ] Add property-based tests for random payload round-trips.
- [ ] Add fuzz tests for `parsePayload` and encrypted-input parsing.
- [ ] Add deterministic test vectors and pin expected outputs by version.

## 3) API Stability and Compatibility (High)

- [ ] Publish explicit compatibility policy (SemVer + wire-format guarantees).
- [ ] Add decode/encode version migration tests across releases.
- [ ] Clearly separate public API from internal modules and enforce with exports.
- [ ] Add deprecation policy and migration notes for behavior changes.

## 4) Tooling and Quality Gates (High)

- [ ] Add linting (`eslint`) and formatting (`prettier`) with CI enforcement.
- [ ] Add CI pipeline: `lint`, `build`, `test`, coverage threshold.
- [ ] Enforce branch protection and required checks before merge.
- [ ] Add dependency and secret scanning in CI.

## 5) Packaging and Supply Chain (High)

- [ ] Keep runtime dependencies minimal; ensure dev-only deps are not required at runtime.
- [ ] Add provenance and release process documentation.
- [ ] Generate SBOM and run vulnerability scans in CI.
- [ ] Add signed/tagged releases and changelog automation.

## 6) Observability and Operations (Medium)

- [ ] Standardize error codes/messages for supportability.
- [ ] Add optional structured logging hooks without leaking secrets.
- [ ] Add performance benchmarks for encode/decode and encrypt/decrypt.
- [ ] Define SLO-style targets for latency and failure rates (for service integrations).

## 7) Documentation and Adoption (Medium)

- [ ] Expand README with secure usage patterns and anti-patterns.
- [ ] Add key rotation playbook with examples.
- [ ] Add interoperability examples (Node versions, TypeScript, CLI usage).
- [ ] Add "security considerations" section and disclosure policy.

## Exit Criteria (Go/No-Go)

- [ ] Security review completed and findings resolved.
- [ ] CI quality gates green on protected branch.
- [ ] Fuzz/property/negative tests passing consistently.
- [ ] Compatibility policy documented and validated by tests.
- [ ] Operational runbooks and incident procedures documented.
