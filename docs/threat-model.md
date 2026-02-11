# Binx Threat Model (Draft)

Status: Draft  
Last updated: 2026-02-07

## 1. System Overview

Binx serializes typed payloads and optionally encrypts them with AES-256-GCM. Payloads may be transferred across services and decrypted by recipients using KID-based key lookup.

## 2. Assets to Protect

- Confidentiality of payload content.
- Integrity/authenticity of encrypted payloads.
- Correct parsing and type safety of decoded values.
- Availability of decode paths under malformed input.
- Key material confidentiality.

## 3. Trust Boundaries

- Producer process boundary.
- Transport boundary (untrusted network/storage).
- Consumer process boundary.
- Key management boundary (KMS, env vars, secret store).

## 4. In-Scope Adversaries

- Network attacker modifying/replaying payloads.
- Malicious client sending malformed inputs.
- Internal service with incorrect key/KID usage.

## 5. Out-of-Scope (Current)

- Host compromise and memory scraping.
- Side-channel resistance beyond Node/OpenSSL defaults.
- Quantum-resistance requirements.

## 6. Security Properties and Controls

- Integrity/authentication: AES-GCM tag verification.
- Confidentiality: AES-256-GCM encryption.
- Key separation: HKDF-derived encryption key.
- Structural consistency: schema hash verification.
- Input hardening: length/truncation checks in decode paths.

## 7. Known Risks / Gaps

- No external cryptography audit completed yet.
- Salt strategy for HKDF is fixed and not deployment-specific.
- No replay protection mechanism in protocol.
- Legacy schema-hash fallback may increase acceptance surface.
- Missing hard limits on total payload size/depth.

## 8. Required Mitigations Before High-Risk Production Use

- Complete external security review.
- Define key management and rotation runbook.
- Add replay protection pattern where required (nonce/timestamp/AAD).
- Add strict-mode guidance for disabling legacy schema-hash fallback.
- Add fuzzing and abuse-limit tests for parser robustness.

## 9. Incident Response Hooks

- Log decode/auth failures with non-sensitive metadata.
- Rotate keys by KID and revoke compromised keys.
- Define rollback/disable mechanism for vulnerable protocol behavior.
