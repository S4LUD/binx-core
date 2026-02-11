import type { BinxLogger } from "../internal/logging";

export interface PayloadOptions {
  key: string;
  compress?: boolean;
  format?: "binary" | "base64";
  kid?: number;
  aad?: string | Uint8Array;
  logger?: BinxLogger;
}

export interface DecryptOptions {
  keyMap: Record<number, string>;
  compress?: boolean;
  allowLegacySchemaHash?: boolean;
  aad?: string | Uint8Array;
  logger?: BinxLogger;
}
