// src\crypto\decrypt.ts
import crypto from "crypto";
import { inflateSync } from "zlib";
import { parsePayload } from "../serialization/decode";
import { ENCRYPTED_FLAG, VERSION } from "../internal/constants";
import { binxError } from "../internal/errors";
import { emitLog } from "../internal/logging";
import { MAX_AAD_BYTES, MAX_DECRYPTED_PAYLOAD_BYTES } from "../internal/limits";
import { assertValidKeyMap } from "../internal/kid";
import { hkdfDerive } from "./hkdf";
import type { DecryptOptions } from "../serialization/types";

function normalizeAad(aad?: string | Uint8Array): Buffer | undefined {
  if (aad === undefined) return undefined;
  const aadBuf = typeof aad === "string" ? Buffer.from(aad, "utf-8") : Buffer.from(aad);
  if (aadBuf.length > MAX_AAD_BYTES) {
    binxError("BINX_LIMIT_EXCEEDED", `AAD exceeds ${MAX_AAD_BYTES} bytes`);
  }
  return aadBuf;
}

export function decryptPayload(
  input: ArrayBuffer | string,
  options: DecryptOptions
): Record<string, unknown> {
  emitLog(options.logger, { op: "decrypt:start", compress: Boolean(options.compress) });
  assertValidKeyMap(options.keyMap);
  try {
    const buf = typeof input === "string" ? Buffer.from(input, "base64") : Buffer.from(input);
    if (buf.length < 30) {
      binxError("BINX_PAYLOAD_TRUNCATED", "Invalid encrypted payload: too short");
    }

    const flagVersion = buf[0];
    const encrypted = (flagVersion & ENCRYPTED_FLAG) === ENCRYPTED_FLAG;
    const version = flagVersion & ~ENCRYPTED_FLAG;

    if (!encrypted) binxError("BINX_NOT_ENCRYPTED", "Payload is not encrypted.");
    if (version !== VERSION) {
      binxError("BINX_INVALID_VERSION", `Unsupported Binx version: ${version}`);
    }

    const kid = buf[1];
    const iv = buf.subarray(2, 14);
    const tag = buf.subarray(14, 30);
    const ciphertext = buf.subarray(30);

    const keyMaterial = options.keyMap[kid];
    if (!keyMaterial) binxError("BINX_KEY_NOT_FOUND", `No key found for KID ${kid}`);

    const keyHash = hkdfDerive(
      Buffer.from(keyMaterial, "utf-8"),
      Buffer.alloc(32, 0),
      Buffer.from("binx-aes-key"),
      32
    );

    const decipher = crypto.createDecipheriv("aes-256-gcm", keyHash, iv);
    const aadBuf = normalizeAad(options.aad);
    if (aadBuf) decipher.setAAD(aadBuf);
    decipher.setAuthTag(tag);

    let decrypted: Buffer;
    try {
      decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    } catch {
      binxError("BINX_DECRYPT_FAILED", "Decryption failed: Invalid key or corrupted data");
    }

    const finalBuf = options.compress
      ? inflateSync(decrypted, { maxOutputLength: MAX_DECRYPTED_PAYLOAD_BYTES })
      : decrypted;
    if (finalBuf.length > MAX_DECRYPTED_PAYLOAD_BYTES) {
      binxError(
        "BINX_LIMIT_EXCEEDED",
        `Decrypted payload exceeds ${MAX_DECRYPTED_PAYLOAD_BYTES} bytes`
      );
    }
    const out = parsePayload(Uint8Array.from(finalBuf).buffer, {
      allowLegacySchemaHash: options.allowLegacySchemaHash,
    });
    emitLog(options.logger, {
      op: "decrypt:success",
      kid,
      bytes: finalBuf.length,
    });
    return out;
  } catch (err) {
    emitLog(options.logger, {
      op: "decrypt:error",
      message: err instanceof Error ? err.message : "decryption failed",
    });
    throw err;
  }
}
