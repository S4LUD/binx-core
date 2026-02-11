# Key Lifecycle Policy (Draft)

Status: Draft  
Last updated: 2026-02-07

## 1. Purpose

Define how encryption keys for Binx are generated, stored, rotated, revoked, and retired.

## 2. Key Types

- Root secret material (source for HKDF input key material).
- Active encryption keys identified by KID (`0-255`).
- Decryption-only legacy keys kept during transition windows.

## 3. Generation

- Generate keys using a cryptographically secure RNG.
- Minimum entropy target: 256 bits for raw secret material.
- Never derive keys from user passwords without a dedicated password KDF policy.

## 4. Storage

- Store key material in a managed secret system (KMS/HSM/secret manager).
- Do not store plaintext keys in repository, logs, or build artifacts.
- Restrict access by least privilege and environment scope.

## 5. Rotation

- Assign a unique KID to each active key.
- Rotation flow:
  1. Provision new key and KID.
  2. Start encrypting with new KID.
  3. Keep old KID available for decrypt during grace period.
  4. Remove old KID after all producers/consumers migrate.
- Default rotation interval recommendation: 90 days (or stricter per policy).

## 6. Revocation and Incident Response

- Immediate revocation triggers:
  - Suspected key exposure.
  - Unauthorized secret-store access.
  - Compromised host handling key material.
- Response:
  1. Generate replacement key + KID.
  2. Disable compromised key for encryption immediately.
  3. Re-encrypt or expire affected data where required.
  4. Audit usage and incident timeline.

## 7. Operational Controls

- Monitor decrypt failures by KID and anomaly spikes.
- Alert on unknown/invalid KID usage.
- Keep an auditable mapping of key creation, activation, and retirement dates.

## 8. Retention and Destruction

- Define retention windows for retired decrypt-only keys based on data TTL and compliance needs.
- Securely destroy retired key material after retention expires.

## 9. Compliance Checklist

- [ ] Key inventory documented.
- [ ] Rotation schedule enforced.
- [ ] Revocation runbook tested.
- [ ] Access logs and audits enabled.
