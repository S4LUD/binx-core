// binx-core-prod.ts
import crypto from "crypto";
import { deflateSync, inflateSync } from "zlib";

const VERSION = 1;
const ENCRYPTED_FLAG = 0x80;
const HMAC_ALGO = "sha256";

// ---------------- Interfaces ----------------
export interface PayloadOptions {
  key: string;
  compress?: boolean;
  format?: "binary" | "base64";
}

// ---------------- Encode (Encrypt & Serialize) ----------------
export function encryptPayload(
  obj: Record<string, unknown>,
  options: PayloadOptions
): ArrayBuffer | string {
  // Serialize
  const buf = serializePayload(obj);

  // Optional compression
  const payloadBuf = options.compress
    ? deflateSync(Buffer.from(buf))
    : Buffer.from(buf);

  // Key derivation
  const keyHash = crypto.createHash("sha256").update(options.key).digest();

  // IV / Nonce
  const iv = crypto.randomBytes(12); // AES-GCM 96-bit

  // Encrypt
  const cipher = crypto.createCipheriv("aes-256-gcm", keyHash, iv);
  const ciphertext = Buffer.concat([cipher.update(payloadBuf), cipher.final()]);
  const tag = cipher.getAuthTag();

  // HMAC for authentication
  const hmac = crypto.createHmac(HMAC_ALGO, keyHash);
  hmac.update(iv);
  hmac.update(tag);
  hmac.update(ciphertext);
  const hmacDigest = hmac.digest();

  // Construct final buffer: [flag | version][iv][tag][ciphertext][hmac]
  const out = Buffer.concat([
    Buffer.from([ENCRYPTED_FLAG | VERSION]),
    iv,
    tag,
    ciphertext,
    hmacDigest,
  ]);

  if (options.format === "base64") return out.toString("base64");
  return out.buffer;
}

// ---------------- Decode (Decrypt & Deserialize) ----------------
export function decryptPayload(
  input: ArrayBuffer | string,
  options: PayloadOptions
): Record<string, unknown> {
  const buf =
    typeof input === "string"
      ? Buffer.from(input, "base64")
      : Buffer.from(input);

  const flagVersion = buf[0];
  const encrypted = (flagVersion & ENCRYPTED_FLAG) === ENCRYPTED_FLAG;
  const version = flagVersion & ~ENCRYPTED_FLAG;

  if (!encrypted)
    throw new Error("Payload is not encrypted. Use parsePayload instead.");
  if (version !== VERSION)
    throw new Error(`Unsupported Binx version: ${version}`);

  // Extract components
  const iv = buf.subarray(1, 13);
  const tag = buf.subarray(13, 29);
  const hmacReceived = buf.subarray(buf.length - 32);
  const ciphertext = buf.subarray(29, buf.length - 32);

  // Verify HMAC
  const keyHash = crypto.createHash("sha256").update(options.key).digest();
  const hmac = crypto.createHmac(HMAC_ALGO, keyHash);
  hmac.update(iv);
  hmac.update(tag);
  hmac.update(ciphertext);
  const hmacDigest = hmac.digest();

  if (!crypto.timingSafeEqual(hmacDigest, hmacReceived)) {
    throw new Error("Authentication failed: HMAC mismatch");
  }

  // Decrypt
  const decipher = crypto.createDecipheriv("aes-256-gcm", keyHash, iv);
  decipher.setAuthTag(tag);

  let decrypted: Buffer;
  try {
    decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  } catch {
    throw new Error("Decryption failed: Invalid key or corrupted data");
  }

  // Optional decompression
  const finalBuf = options.compress ? inflateSync(decrypted) : decrypted;

  return parsePayload(Uint8Array.from(finalBuf).buffer);
}

// ---------------- Plain Serialization ----------------
export function serializePayload(obj: Record<string, unknown>): ArrayBuffer {
  const keys = Object.keys(obj);
  const fieldCount = keys.length;

  const payloads: { keyBytes: number[]; tag: number; bytes: number[] }[] = [];
  let size = 2; // version + fieldCount

  for (const key of keys) {
    const keyBytes = encodeUTF8(key);
    const value = obj[key];
    const { tag, bytes } = encodeTyped(value);
    payloads.push({ keyBytes, tag, bytes });

    size += 1 + keyBytes.length; // key length + key
    size += 1; // tag
    size += 4 + bytes.length; // value length + value
  }

  const buf = new ArrayBuffer(size);
  const view = new DataView(buf);
  let o = 0;

  view.setUint8(o++, VERSION);
  view.setUint8(o++, fieldCount);

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

// ---------------- Plain Deserialization ----------------
export function parsePayload(buf: ArrayBuffer): Record<string, unknown> {
  const view = new DataView(buf);
  let o = 0;

  const version = view.getUint8(o++);
  if (version !== VERSION)
    throw new Error(`Unsupported Binx version: ${version}`);

  const count = view.getUint8(o++);
  const out: Record<string, unknown> = {};

  for (let i = 0; i < count; i++) {
    const keyLen = view.getUint8(o++);
    const key = decodeUTF8(slice(view, o, keyLen));
    o += keyLen;

    const tag = view.getUint8(o++);
    const vLen = view.getUint32(o);
    o += 4;

    const vBytes = slice(view, o, vLen);
    o += vLen;

    out[key] = decodeTyped(tag, vBytes);
  }

  return out;
}

// ------------ Helpers ------------
function encodeTyped(v: unknown) {
  if (v === null) return { tag: 0x01, bytes: [] };
  if (typeof v === "boolean") return { tag: 0x02, bytes: [v ? 1 : 0] };
  if (typeof v === "number" && Number.isInteger(v)) return i32(v);
  if (typeof v === "number") return f64(v);
  if (typeof v === "string") return str(v);
  return json(v);
}

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
  }
  return null;
}

function i32(n: number) {
  const dv = new DataView(new ArrayBuffer(4));
  dv.setInt32(0, n);
  return { tag: 0x03, bytes: Array.from(new Uint8Array(dv.buffer)) };
}

function f64(n: number) {
  const dv = new DataView(new ArrayBuffer(8));
  dv.setFloat64(0, n);
  return { tag: 0x04, bytes: Array.from(new Uint8Array(dv.buffer)) };
}

function str(s: string) {
  return { tag: 0x05, bytes: encodeUTF8(s) };
}

function json(v: unknown) {
  return { tag: 0x06, bytes: encodeUTF8(JSON.stringify(v)) };
}

function encodeUTF8(s: string): number[] {
  return Array.from(new TextEncoder().encode(s));
}

function decodeUTF8(bytes: number[]): string {
  return new TextDecoder().decode(new Uint8Array(bytes));
}

function slice(view: DataView, o: number, n: number): number[] {
  const out = [];
  for (let i = 0; i < n; i++) out.push(view.getUint8(o + i));
  return out;
}

function readI32(bytes: number[]): number {
  const dv = new DataView(new Uint8Array(bytes).buffer);
  return dv.getInt32(0);
}

function readF64(bytes: number[]): number {
  const dv = new DataView(new Uint8Array(bytes).buffer);
  return dv.getFloat64(0);
}
