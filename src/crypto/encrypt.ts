// src\crypto\encrypt.ts
import crypto from "crypto";
import { deflateSync } from "zlib";
import { serializePayload } from "../serialization/encode";
import { ENCRYPTED_FLAG, VERSION } from "../internal/constants";
import { binxError } from "../internal/errors";
import { emitLog } from "../internal/logging";
import { hkdfDerive } from "./hkdf";
import { assertValidKid } from "../internal/kid";
import { MAX_AAD_BYTES } from "../internal/limits";
import type { PayloadOptions } from "../serialization/types";

function normalizeAad(aad?: string | Uint8Array): Buffer | undefined {
  if (aad === undefined) return undefined;
  const aadBuf = typeof aad === "string" ? Buffer.from(aad, "utf-8") : Buffer.from(aad);
  if (aadBuf.length > MAX_AAD_BYTES) {
    binxError("BINX_LIMIT_EXCEEDED", `AAD exceeds ${MAX_AAD_BYTES} bytes`);
  }
  return aadBuf;
}

export function encryptPayload(
  obj: Record<string, unknown>,
  options: PayloadOptions
): ArrayBuffer | string {
  const kidByte = options.kid ?? 0;
  assertValidKid(kidByte, "encrypt options");
  const format = options.format ?? "binary";
  emitLog(options.logger, {
    op: "encrypt:start",
    kid: kidByte,
    compress: Boolean(options.compress),
    format,
  });
  try {
    const buf = serializePayload(obj);
    const payloadBuf = options.compress ? deflateSync(Buffer.from(buf)) : Buffer.from(buf);

    const keyHash = hkdfDerive(
      Buffer.from(options.key, "utf-8"),
      Buffer.alloc(32, 0),
      Buffer.from("binx-aes-key"),
      32
    );

    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", keyHash, iv);
    const aadBuf = normalizeAad(options.aad);
    if (aadBuf) cipher.setAAD(aadBuf);
    const ciphertext = Buffer.concat([cipher.update(payloadBuf), cipher.final()]);
    const tag = cipher.getAuthTag();

    const out = Buffer.concat([
      Buffer.from([ENCRYPTED_FLAG | VERSION]),
      Buffer.from([kidByte]),
      iv,
      tag,
      ciphertext,
    ]);

    emitLog(options.logger, { op: "encrypt:success", bytes: out.length });
    if (options.format === "base64") return out.toString("base64");
    return out.buffer.slice(out.byteOffset, out.byteOffset + out.byteLength);
  } catch (err) {
    emitLog(options.logger, {
      op: "encrypt:error",
      message: err instanceof Error ? err.message : "unknown error",
    });
    throw err;
  }
}
