export type BinxErrorCode =
  | "BINX_INVALID_INPUT"
  | "BINX_INVALID_KID"
  | "BINX_INVALID_VERSION"
  | "BINX_NOT_ENCRYPTED"
  | "BINX_DECRYPT_FAILED"
  | "BINX_KEY_NOT_FOUND"
  | "BINX_SCHEMA_MISMATCH"
  | "BINX_PAYLOAD_TRUNCATED"
  | "BINX_LIMIT_EXCEEDED"
  | "BINX_UNSUPPORTED_TYPE";

export class BinxError extends Error {
  readonly code: BinxErrorCode;

  constructor(code: BinxErrorCode, message: string) {
    super(message);
    this.name = "BinxError";
    this.code = code;
  }
}

export function binxError(code: BinxErrorCode, message: string): never {
  throw new BinxError(code, message);
}
