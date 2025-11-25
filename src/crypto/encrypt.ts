// src\crypto\encrypt.ts
import crypto from "crypto";
import { deflateSync } from "zlib";
import { serializePayload } from "../serialization/encode";
import { ENCRYPTED_FLAG, VERSION } from "../internal/constants";
import { hkdfDerive } from "./hkdf";

export function encryptPayload(
  obj: Record<string, unknown>,
  options: {
    key: string;
    compress?: boolean;
    format?: "binary" | "base64";
    kid?: number;
  }
): ArrayBuffer | string {
  const buf = serializePayload(obj);
  const payloadBuf = options.compress
    ? deflateSync(Buffer.from(buf))
    : Buffer.from(buf);

  const keyHash = hkdfDerive(
    Buffer.from(options.key, "utf-8"),
    Buffer.alloc(32, 0),
    Buffer.from("binx-aes-key"),
    32
  );

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", keyHash, iv);
  const ciphertext = Buffer.concat([cipher.update(payloadBuf), cipher.final()]);
  const tag = cipher.getAuthTag();

  const kidByte = options.kid ?? 0;
  const out = Buffer.concat([
    Buffer.from([ENCRYPTED_FLAG | VERSION]),
    Buffer.from([kidByte]),
    iv,
    tag,
    ciphertext,
  ]);

  return options.format === "base64" ? out.toString("base64") : out.buffer;
}
