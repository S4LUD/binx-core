// src\serialization\validator.ts
export function validateSerializable(obj: unknown, path: string = ""): void {
  if (
    obj === null ||
    typeof obj === "boolean" ||
    typeof obj === "number" ||
    typeof obj === "string"
  ) {
    return;
  }
  if (Array.isArray(obj)) {
    obj.forEach((v, i) => validateSerializable(v, `${path}[${i}]`));
    return;
  }
  if (typeof obj === "object") {
    for (const [k, v] of Object.entries(obj)) {
      validateSerializable(v, path ? `${path}.${k}` : k);
    }
    return;
  }
  throw new Error(`Non-serializable value at ${path}: ${typeof obj}`);
}
