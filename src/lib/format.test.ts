import { describe, expect, it } from "vitest";
import { formatUsdCompact } from "./format";

describe("formatUsdCompact", () => {
  it("looks the same in English and Spanish, except the decimal mark", () => {
    expect(formatUsdCompact("161000", "en")).toBe("$161K");
    expect(formatUsdCompact("161000", "es")).toBe("$161K");
    expect(formatUsdCompact("130255.84", "en")).toBe("$130.3K");
    expect(formatUsdCompact("130255.84", "es")).toBe("$130,3K");
  });

  it("uses M and B for bigger amounts and plain dollars below a thousand", () => {
    expect(formatUsdCompact("1250000", "en")).toBe("$1.3M");
    expect(formatUsdCompact("2000000000", "en")).toBe("$2B");
    expect(formatUsdCompact("703.82", "en")).toBe("$704");
    expect(formatUsdCompact("0.5", "en")).toBe("$0.5");
  });
});
