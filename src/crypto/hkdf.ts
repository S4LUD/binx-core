// src\crypto\hkdf.ts
import crypto from "crypto";

export function hkdfDerive(secret: Buffer, salt: Buffer, info: Buffer, length: number): Buffer {
  const prk = crypto.createHmac("sha256", salt).update(secret).digest();
  let prev = Buffer.alloc(0);
  const out = Buffer.alloc(length);
  let written = 0;
  let i = 0;

  while (written < length) {
    i++;
    const hmac = crypto.createHmac("sha256", prk);
    hmac.update(prev);
    hmac.update(info);
    hmac.update(Buffer.from([i]));
    prev = hmac.digest();
    const take = Math.min(prev.length, length - written);
    prev.copy(out, written, 0, take);
    written += take;
  }

  return out;
}
