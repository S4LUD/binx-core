# binx-core

A compact, deterministic serialization and AES-GCM encryption system designed for predictable, schema-stable payload handling across services. The library provides:

- Typed binary serialization
- Optional compression
- AES‑256‑GCM encryption with HKDF key derivation
- Key rotation via KID (Key Identifier)
- Schema hashing for payload integrity
- Base64 or binary output formats

---

## Features

### 1. **Deterministic Serialization**

- Converts JS objects into a stable binary format.
- Supports:

  - `null`
  - `boolean`
  - `number` (int32 + float64)
  - `bigint` (int64)
  - `string`
  - `Date`
  - `Uint8Array`
  - Nested objects and arrays.

- Produces a schema hash (SHA‑256 of `key:type`) to ensure structural consistency.

### 2. **Encryption (AES‑256‑GCM)**

- Uses AES‑GCM with 96‑bit IV.
- HKDF(SHA‑256) used to derive a strong encryption key.
- Output layout:

  - `[flag|version][kid][iv][tag][ciphertext]`

- Supports key rotation via `kid`.
- Supports `binary` or `base64` output.

### 3. **Decryption**

- Uses the KID byte to select the correct key.
- Verifies authentication via AES‑GCM tag.
- Supports optional decompression.

### 4. **Compression (optional)**

- Uses `deflateSync` / `inflateSync`.
- Reduces serialized payload sizes before encryption.

### 5. **Input Validation**

- Deep validation of values before serialization.
- Prevents unsupported types from passing silently.

---

## API Overview

### `encryptPayload(obj, options)`

Encrypts and serializes a payload.

**Options:**

- `key: string` — raw key material
- `compress?: boolean` — enables compression
- `format?: "binary" | "base64"` — output format
- `kid?: number` — key identifier (defaults to 0)

**Returns:**

- `ArrayBuffer` or `string`

### `decryptPayload(input, options)`

Decrypts and deserializes a payload.

**Options:**

- `keyMap: Record<number, string>` — key lookup table by KID
- `compress?: boolean` — whether the original payload was compressed

**Returns:**

- `Record<string, unknown>`

### `serializePayload(obj)`

Creates a deterministic binary representation.

### `parsePayload(buffer)`

Parses a serialized buffer back into an object.

### `validateSerializable(value)`

Ensures a JS value can be serialized.

---

## Example Usage

### Encrypt

```ts
import { encryptPayload } from "binx-core";

const encrypted = encryptPayload(
  { userId: 42, active: true, when: new Date() },
  { key: "secret", compress: true, format: "base64", kid: 1 }
);
```

### Decrypt

```ts
import { decryptPayload } from "binx-core";

const payload = decryptPayload(encrypted, {
  keyMap: { 1: "secret" },
  compress: true,
});
```

---

## Output Format Details

### Encryption Output

```
[ 1 byte flag+version ]
[ 1 byte KID ]
[ 12 bytes IV ]
[ 16 bytes GCM tag ]
[ ciphertext ... ]
```

### Serialization Layout

```
[version][fieldCount][schemaHash32]
  repeat for each key:
    [keyLen][keyBytes][tag][valueLen][valueBytes...]
```

---

## Key Rotation

- Multiple keys supported via `keyMap`.
- Sender attaches `kid`.
- Receiver resolves via `keyMap[kid]`.

---

## Error Handling

- Throws on unsupported schema version.
- Throws on invalid KID.
- Throws on AES‑GCM authentication failure.
- Throws on non‑serializable values.

---

## Roadmap

- Streaming encoder/decoder
- Optional GCM‑SIV mode
- WASM implementation for browser environments
