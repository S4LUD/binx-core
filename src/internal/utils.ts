// src\internal\utils.ts
export function encodeUTF8(s: string): number[] {
  return Array.from(new TextEncoder().encode(s));
}

export function decodeUTF8(bytes: number[]): string {
  return new TextDecoder().decode(new Uint8Array(bytes));
}

export function slice(view: DataView, o: number, n: number): number[] {
  const out = [];
  for (let i = 0; i < n; i++) out.push(view.getUint8(o + i));
  return out;
}

export function readI32(bytes: number[]): number {
  const dv = new DataView(new Uint8Array(bytes).buffer);
  return dv.getInt32(0);
}

export function readF64(bytes: number[]): number {
  const dv = new DataView(new Uint8Array(bytes).buffer);
  return dv.getFloat64(0);
}
