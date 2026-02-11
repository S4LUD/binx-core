// src\serialization\encode.ts
import { VERSION } from "../internal/constants";
import { binxError } from "../internal/errors";
import { MAX_SERIALIZED_PAYLOAD_BYTES } from "../internal/limits";
import { encodeUTF8 } from "../internal/utils";
import { validateSerializable } from "./validator";
import crypto from "crypto";

function i32(n: number) {
  const dv = new DataView(new ArrayBuffer(4));
  dv.setInt32(0, n);
  return { tag: 0x03, bytes: Array.from(new Uint8Array(dv.buffer)) };
}

function i64(n: bigint) {
  const dv = new DataView(new ArrayBuffer(8));
  dv.setBigInt64(0, n);
  return { tag: 0x08, bytes: Array.from(new Uint8Array(dv.buffer)) };
}

function f64(n: number) {
  const dv = new DataView(new ArrayBuffer(8));
  dv.setFloat64(0, n);
  return { tag: 0x04, bytes: Array.from(new Uint8Array(dv.buffer)) };
}

function str(s: string) {
  return { tag: 0x05, bytes: encodeUTF8(s) };
}

function datetime(d: Date) {
  return { tag: 0x09, bytes: encodeUTF8(d.toISOString()) };
}

function json(v: unknown) {
  return { tag: 0x06, bytes: encodeUTF8(JSON.stringify(v)) };
}

function blob(data: Uint8Array) {
  return { tag: 0x0a, bytes: Array.from(data) };
}

function encodeTyped(v: unknown) {
  if (v === null) return { tag: 0x01, bytes: [] };
  if (typeof v === "boolean") return { tag: 0x02, bytes: [v ? 1 : 0] };
  if (typeof v === "number" && Number.isInteger(v)) {
    if (v >= -2147483648 && v <= 2147483647) return i32(v);
    return f64(v);
  }
  if (typeof v === "bigint") return i64(v);
  if (typeof v === "number") return f64(v);
  if (typeof v === "string") return str(v);
  if (v instanceof Date) return datetime(v);
  if (v instanceof Uint8Array) return blob(v);
  return json(v);
}

export function serializePayload(obj: Record<string, unknown>): ArrayBuffer {
  validateSerializable(obj);

  const keys = Object.keys(obj);
  const fieldCount = keys.length;
  if (fieldCount > 255) {
    binxError("BINX_LIMIT_EXCEEDED", "Payload has too many fields; max supported is 255");
  }

  const payloads: { keyBytes: number[]; tag: number; bytes: number[] }[] = [];
  let size = 2; // version + fieldCount

  for (const key of keys) {
    const keyBytes = encodeUTF8(key);
    if (keyBytes.length > 255) {
      binxError("BINX_LIMIT_EXCEEDED", `Field name too long: "${key}"`);
    }
    const value = obj[key];
    const { tag, bytes } = encodeTyped(value);
    payloads.push({ keyBytes, tag, bytes });

    size += 1 + keyBytes.length;
    size += 1;
    size += 4 + bytes.length;
  }

  const schemaStr = keys
    .map((k, i) => `${k}:${payloads[i].tag.toString(16).padStart(2, "0")}`)
    .join(",");
  const schemaHash = crypto.createHash("sha256").update(schemaStr).digest();
  size += schemaHash.length;
  if (size > MAX_SERIALIZED_PAYLOAD_BYTES) {
    binxError(
      "BINX_LIMIT_EXCEEDED",
      `Serialized payload exceeds ${MAX_SERIALIZED_PAYLOAD_BYTES} bytes`
    );
  }

  const buf = new ArrayBuffer(size);
  const view = new DataView(buf);
  let o = 0;

  view.setUint8(o++, VERSION);
  view.setUint8(o++, fieldCount);

  for (let i = 0; i < schemaHash.length; i++) {
    view.setUint8(o++, schemaHash[i]);
  }

  for (const f of payloads) {
    view.setUint8(o++, f.keyBytes.length);
    for (const b of f.keyBytes) view.setUint8(o++, b);
    view.setUint8(o++, f.tag);
    view.setUint32(o, f.bytes.length);
    o += 4;
    for (const b of f.bytes) view.setUint8(o++, b);
  }

  return buf;
}
