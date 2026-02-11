import crypto from "crypto";
import { deflateSync } from "zlib";
import { serializePayload } from "../serialization/encode";
import { ENCRYPTED_FLAG, VERSION, HMAC_ALGO } from "../internal/constants";

export function serializePayloadForTest(obj: Record<string, unknown>) {
  return serializePayload(obj);
}

export function encryptPayloadForTest(
  obj: Record<string, unknown>,
  options: { key: string; compress?: boolean; iv?: Buffer; test?: boolean }
): string {
  if (!options.test || process.env.BINX_TEST_VECTORS !== "1")
    throw new Error("Test-vector mode locked.");

  const buf = serializePayload(obj);
  const payloadBuf = options.compress ? deflateSync(Buffer.from(buf)) : Buffer.from(buf);

  const keyHash = crypto.createHash("sha256").update(options.key).digest();
  const iv = options.iv ?? Buffer.alloc(12, 0);

  const cipher = crypto.createCipheriv("aes-256-gcm", keyHash, iv);
  const ciphertext = Buffer.concat([cipher.update(payloadBuf), cipher.final()]);
  const tag = cipher.getAuthTag();

  const hmac = crypto.createHmac(HMAC_ALGO, keyHash);
  hmac.update(iv);
  hmac.update(tag);
  hmac.update(ciphertext);
  const hmacDigest = hmac.digest();

  const out = Buffer.concat([
    Buffer.from([ENCRYPTED_FLAG | VERSION]),
    iv,
    tag,
    ciphertext,
    hmacDigest,
  ]);

  return out.toString("base64");
}
