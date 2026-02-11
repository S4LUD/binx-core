import { binxError } from "./errors";

export function assertValidKid(kid: number, context: string): void {
  if (!Number.isInteger(kid) || kid < 0 || kid > 255) {
    binxError("BINX_INVALID_KID", `Invalid KID in ${context}: must be an integer in range 0-255`);
  }
}

export function assertValidKeyMap(keyMap: Record<number, string>): void {
  for (const rawKey of Object.keys(keyMap)) {
    const kid = Number(rawKey);
    assertValidKid(kid, "keyMap");
  }
}
