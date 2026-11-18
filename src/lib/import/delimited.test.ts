import { describe, expect, it } from "vitest";
import { dateAtNoonUtc, decodeText, isBlankRow, isIsoDate, parseDelimited } from "./delimited";

describe("decodeText", () => {
  it("reads UTF-16 LE with a byte order mark (Nordnet)", () => {
    const bytes = new Uint8Array(Buffer.from("﻿Købt\tØre", "utf16le"));
    expect(decodeText(bytes)).toBe("Købt\tØre");
  });

  it("reads UTF-8 with or without a byte order mark", () => {
    expect(decodeText(new Uint8Array(Buffer.from("﻿Time,Coin")))).toBe("Time,Coin");
    expect(decodeText(new Uint8Array(Buffer.from("Værdi")))).toBe("Værdi");
  });
});

describe("parseDelimited", () => {
  it("splits rows and cells with CRLF or LF", () => {
    expect(parseDelimited("a,b\r\nc,d\ne,f", ",")).toEqual([["a", "b"], ["c", "d"], ["e", "f"]]);
  });

  it("handles quoted cells with delimiters, quotes and line breaks inside", () => {
    expect(parseDelimited('"1,5","say ""hi""","two\nlines"\n', ",")).toEqual([
      ["1,5", 'say "hi"', "two\nlines"],
    ]);
  });

  it("keeps empty cells and blank lines so line numbers stay right", () => {
    expect(parseDelimited("a\t\tc\n\nd", "\t")).toEqual([["a", "", "c"], [""], ["d"]]);
  });

  it("drops a leading BOM", () => {
    expect(parseDelimited("﻿Id,Time", ",")).toEqual([["Id", "Time"]]);
  });
});

describe("small helpers", () => {
  it("detects blank rows", () => {
    expect(isBlankRow(["", "  "])).toBe(true);
    expect(isBlankRow(["", "x"])).toBe(false);
  });

  it("accepts only real ISO dates", () => {
    expect(isIsoDate("2026-11-13")).toBe(true);
    expect(isIsoDate("2026-02-30")).toBe(false);
    expect(isIsoDate("13.11.2026")).toBe(false);
  });

  it("stores a day without time at noon UTC", () => {
    expect(dateAtNoonUtc("2026-11-13")).toBe("2026-11-13T12:00:00.000Z");
  });
});
