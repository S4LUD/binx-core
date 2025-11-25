// src\crypto\decrypt.ts
import crypto from "crypto";
import { inflateSync } from "zlib";
import { parsePayload } from "../serialization/decode";
import { ENCRYPTED_FLAG, VERSION } from "../internal/constants";
import { hkdfDerive } from "./hkdf";

export function decryptPayload(
  input: ArrayBuffer | string,
  options: { keyMap: Record<number, string>; compress?: boolean }
): Record<string, unknown> {
  const buf =
    typeof input === "string"
      ? Buffer.from(input, "base64")
      : Buffer.from(input);

  const flagVersion = buf[0];
  const encrypted = (flagVersion & ENCRYPTED_FLAG) === ENCRYPTED_FLAG;
  const version = flagVersion & ~ENCRYPTED_FLAG;

  if (!encrypted) throw new Error("Payload is not encrypted.");
  if (version !== VERSION)
    throw new Error(`Unsupported Binx version: ${version}`);

  const kid = buf[1];
  const iv = buf.subarray(2, 14);
  const tag = buf.subarray(14, 30);
  const ciphertext = buf.subarray(30);

  const keyMaterial = options.keyMap[kid];
  if (!keyMaterial) throw new Error(`No key found for KID ${kid}`);

  const keyHash = hkdfDerive(
    Buffer.from(keyMaterial, "utf-8"),
    Buffer.alloc(32, 0),
    Buffer.from("binx-aes-key"),
    32
  );

  const decipher = crypto.createDecipheriv("aes-256-gcm", keyHash, iv);
  decipher.setAuthTag(tag);

  let decrypted: Buffer;
  try {
    decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  } catch {
    throw new Error("Decryption failed: Invalid key or corrupted data");
  }

  const finalBuf = options.compress ? inflateSync(decrypted) : decrypted;
  return parsePayload(Uint8Array.from(finalBuf).buffer);
}
