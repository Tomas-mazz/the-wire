/**
 * Reads any supported import file: works out which broker made it and hands
 * it to that reader. Pure: bytes in, typed rows out.
 */
import { parseBinance } from "./binance";
import { parseCoinbase } from "./coinbase";
import { decodeText } from "./delimited";
import { parseNordnet } from "./nordnet";
import { parseTemplate } from "./template";
import type { ImportResult } from "./types";

export type * from "./types";
export { TEMPLATE_HEADERS } from "./template";

/** Larger files are refused before reading (a few years of trades is well under 1 MB). */
export const MAX_IMPORT_BYTES = 2 * 1024 * 1024;

export function readImportFile(bytes: Uint8Array, fileName: string, timeZone: string): ImportResult {
  const text = decodeText(bytes);
  const nordnet = parseNordnet(text);
  if (nordnet.ok) return nordnet;
  return (
    parseCoinbase(text) ??
    parseBinance(text, fileName) ??
    parseTemplate(text, timeZone) ?? { ok: false, error: "unrecognized_format" }
  );
}
