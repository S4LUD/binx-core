// src\serialization\decode.ts
import { VERSION } from "../internal/constants";
import { binxError } from "../internal/errors";
import { slice, decodeUTF8, readI32, readF64 } from "../internal/utils";
import crypto from "crypto";

function decodeTyped(tag: number, bytes: number[]) {
  switch (tag) {
    case 0x01:
      return null;
    case 0x02:
      return bytes[0] === 1;
    case 0x03:
      return readI32(bytes);
    case 0x04:
      return readF64(bytes);
    case 0x05:
      return decodeUTF8(bytes);
    case 0x06:
      return JSON.parse(decodeUTF8(bytes));
    case 0x07:
      return bytes;
    case 0x08:
      const dv = new DataView(Uint8Array.from(bytes).buffer);
      return dv.getBigInt64(0);
    case 0x09:
      return new Date(decodeUTF8(bytes));
    case 0x0a:
      return new Uint8Array(bytes);
  }
  return null;
}

export function parsePayload(
  buf: ArrayBuffer,
  options?: { allowLegacySchemaHash?: boolean }
): Record<string, unknown> {
  const allowLegacySchemaHash = options?.allowLegacySchemaHash ?? true;
  const view = new DataView(buf);
  let o = 0;

  if (view.byteLength < 34) {
    binxError("BINX_PAYLOAD_TRUNCATED", "Invalid payload: too short");
  }

  const version = view.getUint8(o++);
  if (version !== VERSION) {
    binxError("BINX_INVALID_VERSION", `Unsupported Binx version: ${version}`);
  }

  const count = view.getUint8(o++);
  const expectedSchemaHash = slice(view, o, 32);

  o += 32;

  const out: Record<string, unknown> = {};
  const schemaParts: string[] = [];
  const schemaLegacyParts: string[] = [];

  for (let i = 0; i < count; i++) {
    if (o + 1 > view.byteLength) {
      binxError("BINX_PAYLOAD_TRUNCATED", "Invalid payload: truncated key");
    }
    const keyLen = view.getUint8(o++);
    if (o + keyLen > view.byteLength) {
      binxError("BINX_PAYLOAD_TRUNCATED", "Invalid payload: truncated key bytes");
    }
    const key = decodeUTF8(slice(view, o, keyLen));
    o += keyLen;

    if (o + 5 > view.byteLength) {
      binxError("BINX_PAYLOAD_TRUNCATED", "Invalid payload: truncated value header");
    }
    const tag = view.getUint8(o++);
    const vLen = view.getUint32(o);
    o += 4;

    if (o + vLen > view.byteLength) {
      binxError("BINX_PAYLOAD_TRUNCATED", "Invalid payload: truncated value bytes");
    }
    const vBytes = slice(view, o, vLen);
    o += vLen;

    const decoded = decodeTyped(tag, vBytes);
    schemaParts.push(`${key}:${tag.toString(16).padStart(2, "0")}`);
    schemaLegacyParts.push(`${key}:${typeof decoded}`);
    out[key] = decoded;
  }

  const computedSchemaHash = Array.from(
    crypto.createHash("sha256").update(schemaParts.join(",")).digest()
  );
  if (computedSchemaHash.length !== expectedSchemaHash.length) {
    binxError("BINX_SCHEMA_MISMATCH", "Schema hash mismatch");
  }
  for (let i = 0; i < computedSchemaHash.length; i++) {
    if (computedSchemaHash[i] !== expectedSchemaHash[i]) {
      if (!allowLegacySchemaHash) {
        binxError("BINX_SCHEMA_MISMATCH", "Schema hash mismatch");
      }
      const legacySchemaHash = Array.from(
        crypto.createHash("sha256").update(schemaLegacyParts.join(",")).digest()
      );
      for (let j = 0; j < legacySchemaHash.length; j++) {
        if (legacySchemaHash[j] !== expectedSchemaHash[j]) {
          binxError("BINX_SCHEMA_MISMATCH", "Schema hash mismatch");
        }
      }
      break;
    }
  }

  return out;
}
