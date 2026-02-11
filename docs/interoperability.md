# Interoperability Guide

Status: Draft  
Last updated: 2026-02-07

## Supported Runtime Assumptions

- Node.js 20+ recommended (22 used in CI).
- TypeScript 5.x for source development.
- CommonJS package output (`dist/*.js`).

## TypeScript Usage

```ts
import { encryptPayload, decryptPayload } from "binx-core";
```

## JavaScript Usage (CommonJS)

```js
const { encryptPayload, decryptPayload } = require("binx-core");
```

## CLI Usage

After install and build/publish:

```bash
binx-core encode payload.json --key "secret" --kid 1 --compress
binx-core decode encrypted.txt --key "secret" --kid 1 --compress
```

## Cross-Service Notes

- All participants must agree on `VERSION`.
- Producers/consumers must share compatible KID/key maps.
- For strict schema behavior, set `allowLegacySchemaHash: false` during decode.
