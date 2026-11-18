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

/**
 * Larger files are refused before reading. Server Actions accept 1 MB bodies by
 * default (next.config serverActions.bodySizeLimit), and a few years of trades
 * is a few dozen KB, so this leaves room for the form's own bytes.
 */
export const MAX_IMPORT_BYTES = 900 * 1024;

/** Magic numbers of files people may try instead of a CSV: PDF, PNG, JPEG, GIF, WebP, HEIC. */
export function isDocumentOrImage(bytes: Uint8Array): boolean {
  const starts = (...sig: number[]) => sig.every((b, i) => bytes[i] === b);
  const ascii = (from: number, text: string) => [...text].every((c, i) => bytes[from + i] === c.charCodeAt(0));
  return (
    ascii(0, "%PDF") ||
    starts(0x89, 0x50, 0x4e, 0x47) ||
    starts(0xff, 0xd8, 0xff) ||
    ascii(0, "GIF8") ||
    (ascii(0, "RIFF") && ascii(8, "WEBP")) ||
    (ascii(4, "ftyp") && (ascii(8, "heic") || ascii(8, "heix") || ascii(8, "mif1")))
  );
}

export function readImportFile(bytes: Uint8Array, fileName: string, timeZone: string): ImportResult {
  if (isDocumentOrImage(bytes)) return { ok: false, error: "unsupported_file" };
  const text = decodeText(bytes);
  const nordnet = parseNordnet(text);
  if (nordnet.ok) return nordnet;
  return (
    parseCoinbase(text) ??
    parseBinance(text, fileName) ??
    parseTemplate(text, timeZone) ?? { ok: false, error: "unrecognized_format" }
  );
}
