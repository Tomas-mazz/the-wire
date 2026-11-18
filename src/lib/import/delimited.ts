/**
 * Generic helpers to read CSV / TSV exports. Pure and tested.
 */

/**
 * Turns the raw bytes of an uploaded file into text.
 *
 * Brokers disagree on encodings: Nordnet exports UTF-16 little-endian with a
 * byte order mark, Binance and Coinbase export UTF-8. The BOM tells them apart;
 * without one we assume UTF-8.
 */
export function decodeText(bytes: Uint8Array): string {
  let encoding = "utf-8";
  if (bytes[0] === 0xff && bytes[1] === 0xfe) encoding = "utf-16le";
  else if (bytes[0] === 0xfe && bytes[1] === 0xff) encoding = "utf-16be";
  // TextDecoder drops the BOM by itself.
  return new TextDecoder(encoding).decode(bytes);
}

/**
 * Splits delimited text into rows of cells.
 *
 * Handles quoted cells ("a, b"), doubled quotes inside them ("say ""hi""") and
 * both \n and \r\n line ends. Blank lines are kept as [""] so line numbers stay
 * true to the file; callers skip them.
 */
export function parseDelimited(text: string, delimiter: string): string[][] {
  const source = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    if (quoted) {
      if (char === '"') {
        if (source[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        cell += char;
      }
    } else if (char === '"' && cell === "") {
      quoted = true;
    } else if (char === delimiter) {
      row.push(cell);
      cell = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && source[i + 1] === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  if (cell !== "" || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

export function isBlankRow(row: readonly string[]): boolean {
  return row.every((cell) => cell.trim() === "");
}

/** "2026-11-13" → true only for a real calendar date. */
export function isIsoDate(text: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return false;
  const date = new Date(`${text}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(text);
}

/**
 * A date with no time of day, stored at 12:00 UTC.
 *
 * Noon keeps the same calendar day when shown in any time zone from UTC−11 to
 * UTC+11, so a trade from the 13th never shows up as the 12th or the 14th.
 */
export function dateAtNoonUtc(isoDate: string): string {
  return `${isoDate}T12:00:00.000Z`;
}
