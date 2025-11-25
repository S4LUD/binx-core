// binx-core.ts
import crypto from "crypto";

const ENCRYPTED_FLAG = 0x80;

// ---------------- Encode ----------------
export function encodeBinx(
  obj: Record<string, unknown> | string | number | boolean | null,
  options?: { key?: string }
): ArrayBuffer {
  if (typeof obj !== "object" || obj === null) {
    // wrap primitive into a dummy object
    obj = { value: obj };
  }

  const keys = Object.keys(obj);
  const fieldCount = keys.length;

  const payloads: { keyBytes: number[]; tag: number; bytes: number[] }[] = [];
  let size = 2; // version + fieldCount

  for (const key of keys) {
    const keyBytes = encodeUTF8(key);
    const value = obj[key];
    const { tag, bytes } = encodeTyped(value);
    payloads.push({ keyBytes, tag, bytes });

    size += 1 + keyBytes.length;
    size += 1;
    size += 4 + bytes.length;
  }

  const buf = new ArrayBuffer(size);
  const view = new DataView(buf);
  let o = 0;

  view.setUint8(o++, 1); // protocol version
  view.setUint8(o++, fieldCount);

  for (const f of payloads) {
    view.setUint8(o++, f.keyBytes.length);
    for (const b of f.keyBytes) view.setUint8(o++, b);

    view.setUint8(o++, f.tag);

    view.setUint32(o, f.bytes.length);
    o += 4;

    for (const b of f.bytes) view.setUint8(o++, b);
  }

  // ---------------- Optional Encryption ----------------
  if (!options?.key) return buf;

  const keyHash = crypto.createHash("sha256").update(options.key).digest();
  const iv = crypto.randomBytes(12); // 96-bit nonce
  const bufBuffer = Buffer.from(buf); // <-- convert ArrayBuffer to Buffer

  const cipher = crypto.createCipheriv("aes-256-gcm", keyHash, iv);
  const encrypted = Buffer.concat([cipher.update(bufBuffer), cipher.final()]);
  const tag = cipher.getAuthTag();

  const out = Buffer.concat([
    Buffer.from([ENCRYPTED_FLAG | 1]),
    iv,
    tag,
    encrypted,
  ]);
  return Uint8Array.from(out).buffer;
}

// ---------------- Decode ----------------
export function decodeBinx(
  buf: ArrayBuffer,
  options?: { key?: string }
): Record<string, unknown> {
  const arr = new Uint8Array(buf);

  const encrypted = (arr[0] & 0x80) === 0x80;

  if (encrypted) {
    if (!options?.key) {
      throw new Error(
        "Encrypted Binx frame detected: a secret key is required to decode this payload"
      );
    }

    const key = options.key!;
    const iv = arr.subarray(1, 13);
    const tag = arr.subarray(13, 29);
    const ciphertext = arr.subarray(29);

    const keyHash = crypto.createHash("sha256").update(key).digest();
    const decipher = crypto.createDecipheriv("aes-256-gcm", keyHash, iv);
    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);

    const decryptedCopy = Uint8Array.from(decrypted);
    decryptedCopy[0] &= 0x7f;

    return decodeBinxPlain(decryptedCopy.buffer);
  }

  return decodeBinxPlain(buf);
}

// ---------------- Plain Decode (no encryption) ----------------
function decodeBinxPlain(buf: ArrayBuffer): Record<string, unknown> {
  const view = new DataView(buf);
  let o = 0;

  const version = view.getUint8(o++);
  if (version !== 1) throw new Error(`Unsupported Binx version: ${version}`);

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

// ------------ helpers ------------

function encodeTyped(v: unknown) {
  if (v === null) return { tag: 0x01, bytes: [] };
  if (typeof v === "boolean") return { tag: 0x02, bytes: [v ? 1 : 0] };
  if (Number.isInteger(v)) return i32(v as number);
  if (typeof v === "number") return f64(v as number);
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
