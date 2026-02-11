// src\serialization\validator.ts
import {
  MAX_ARRAY_LENGTH,
  MAX_NESTING_DEPTH,
  MAX_OBJECT_KEYS,
  MAX_STRING_UTF8_BYTES,
} from "../internal/limits";
import { binxError } from "../internal/errors";
import { encodeUTF8 } from "../internal/utils";

export function validateSerializable(obj: unknown, path: string = "", depth: number = 0): void {
  if (depth > MAX_NESTING_DEPTH) {
    binxError("BINX_LIMIT_EXCEEDED", `Max nesting depth exceeded at ${path || "<root>"}`);
  }

  if (
    obj === null ||
    typeof obj === "boolean" ||
    typeof obj === "number" ||
    typeof obj === "bigint"
  ) {
    return;
  }
  if (typeof obj === "string") {
    if (encodeUTF8(obj).length > MAX_STRING_UTF8_BYTES) {
      binxError("BINX_LIMIT_EXCEEDED", `String too large at ${path || "<root>"}`);
    }
    return;
  }
  if (obj instanceof Date || obj instanceof Uint8Array) return;
  if (Array.isArray(obj)) {
    if (obj.length > MAX_ARRAY_LENGTH) {
      binxError("BINX_LIMIT_EXCEEDED", `Array too large at ${path || "<root>"}`);
    }
    obj.forEach((v, i) => validateSerializable(v, `${path}[${i}]`, depth + 1));
    return;
  }
  if (typeof obj === "object") {
    const entries = Object.entries(obj);
    if (entries.length > MAX_OBJECT_KEYS) {
      binxError("BINX_LIMIT_EXCEEDED", `Object has too many keys at ${path || "<root>"}`);
    }
    for (const [k, v] of entries) {
      validateSerializable(v, path ? `${path}.${k}` : k, depth + 1);
    }
    return;
  }
  binxError("BINX_UNSUPPORTED_TYPE", `Non-serializable value at ${path}: ${typeof obj}`);
}
