import { encryptPayload } from "./crypto/encrypt";
import { decryptPayload } from "./crypto/decrypt";

const payload = {
  userId: 42,
  active: true,
  rating: 4.7,
  note: "hello",
  meta: { a: 1, b: 2 },
};

let encrypted: string | ArrayBuffer;
try {
  encrypted = encryptPayload(payload, {
    key: "my-secret-key",
    compress: true,
    format: "base64",
    kid: 1, // specify KID
  });
  console.log({ encrypted });
} catch (err) {
  console.error("Encryption failed:", err);
}

let out: Record<string, unknown>;
try {
  out = decryptPayload(encrypted!, {
    keyMap: {
      1: "my-secret-key", // map KID to key
    },
    compress: true,
  });
  console.log({ out });
} catch (err) {
  console.error("Decryption failed:", (err as Error).message);
}
