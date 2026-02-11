# Binx Protocol Specification (Draft)

Status: Draft  
Version: 1

## 1. Scope

This document defines the on-wire format and compatibility rules for Binx serialized and encrypted payloads.

## 2. Serialization Format

Byte layout:

```
[version:1][fieldCount:1][schemaHash:32]
repeat fieldCount times:
  [keyLen:1][keyBytes:keyLen][tag:1][valueLen:4][valueBytes:valueLen]
```

Notes:

- `version` is the Binx serialization version.
- `fieldCount` max is 255.
- `keyLen` max is 255 (UTF-8 bytes).
- `valueLen` is uint32.

## 3. Type Tags

- `0x01`: null
- `0x02`: boolean
- `0x03`: int32
- `0x04`: float64
- `0x05`: UTF-8 string
- `0x06`: JSON value
- `0x08`: int64 (bigint)
- `0x09`: Date (ISO string)
- `0x0a`: Uint8Array/blob

## 4. Schema Hash

Current hash input:

- Comma-joined sequence of `key:typeTagHex` for each field in serialized order.

Legacy-compatible hash input:

- Comma-joined sequence of `key:typeof(decodedValue)` for each field.

Decode behavior:

- Validate current hash first.
- If `allowLegacySchemaHash` is enabled, accept legacy hash as fallback.

## 5. Encryption Envelope

Byte layout:

```
[flagVersion:1][kid:1][iv:12][tag:16][ciphertext:n]
```

Where:

- `flagVersion = ENCRYPTED_FLAG | VERSION`
- `kid` identifies key material used for decryption lookup.
- Cipher: AES-256-GCM
- IV length: 96 bits
- Optional AAD (Associated Authenticated Data) is not serialized in the envelope;
  it must be provided out-of-band and exactly matched during decryption.

## 6. Key Derivation

- HKDF-SHA256
- Input key material: UTF-8 bytes of provided `key`
- Salt: 32 zero bytes (current behavior)
- Info: `"binx-aes-key"`
- Length: 32 bytes

## 7. Compatibility Rules

- Bump `VERSION` on incompatible wire-format changes.
- Maintain decode support for documented legacy modes within same major release.
- Add compatibility tests before release for each supported version/fallback.

## 8. Open Items

- Define max payload byte size and nesting limits.
- Expand AAD guidance for cross-service metadata conventions.
- Decide future migration policy for legacy schema-hash fallback.
