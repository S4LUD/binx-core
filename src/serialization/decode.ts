// src\serialization\decode.ts
import { VERSION } from "../internal/constants";
import { slice, decodeUTF8, readI32, readF64 } from "../internal/utils";

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

export function parsePayload(buf: ArrayBuffer): Record<string, unknown> {
  const view = new DataView(buf);
  let o = 0;

  const version = view.getUint8(o++);
  if (version !== VERSION)
    throw new Error(`Unsupported Binx version: ${version}`);

  const count = view.getUint8(o++);

  o += 32;

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
