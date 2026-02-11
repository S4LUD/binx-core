export type BinxLogEvent =
  | { op: "encrypt:start"; kid: number; compress: boolean; format: "binary" | "base64" }
  | { op: "encrypt:success"; bytes: number }
  | { op: "encrypt:error"; message: string }
  | { op: "decrypt:start"; compress: boolean }
  | { op: "decrypt:success"; kid: number; bytes: number }
  | { op: "decrypt:error"; message: string };

export type BinxLogger = (event: BinxLogEvent) => void;

export function emitLog(logger: BinxLogger | undefined, event: BinxLogEvent): void {
  if (!logger) return;
  try {
    logger(event);
  } catch {
    // Logging must never break crypto/serialization flow.
  }
}
