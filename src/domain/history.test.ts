import { describe, expect, it } from "vitest";
import { Dec } from "./decimal";
import { dayRange, periodChange, priceChange, utcDay, valueSeries } from "./history";
import type { LedgerTransaction } from "./holdings";

function ltx(
  assetId: string,
  type: LedgerTransaction["type"],
  quantity: string,
  unitPrice: string,
  executedAt: string,
  fee: string | null = null,
): LedgerTransaction {
  return {
    id: `${assetId}-${type}-${executedAt}`,
    projectId: "p",
    assetId,
    type,
    quantity,
    unitPrice,
    fee,
    executedAt,
    createdAt: executedAt,
  };
}

const str = (d: Dec) => d.toFixed();

describe("utcDay / dayRange", () => {
  it("cuts timestamps to the UTC day and lists every day in between", () => {
    expect(utcDay("2026-11-20T23:30:00Z")).toBe("2026-11-20");
    expect(utcDay("2026-11-20T23:30:00-03:00")).toBe("2026-11-21");
    expect(dayRange("2026-02-27", "2026-03-02")).toEqual(["2026-02-27", "2026-02-28", "2026-03-01", "2026-03-02"]);
    expect(dayRange("2026-03-02", "2026-03-01")).toEqual([]);
  });
});

describe("valueSeries", () => {
  const closes = new Map([
    [
      "AAPL",
      [
        { day: "2026-11-13", close: "100" }, // Friday
        { day: "2026-11-16", close: "110" }, // Monday
        { day: "2026-11-17", close: "105" },
      ],
    ],
    [
      "BTC",
      [
        { day: "2026-11-14", close: "50000" },
        { day: "2026-11-15", close: "51000" },
        { day: "2026-11-16", close: "49000" },
        { day: "2026-11-17", close: "52000" },
      ],
    ],
  ]);

  it("values what was held each day at the last close, keeping Friday over the weekend", () => {
    const txs = [
      ltx("AAPL", "buy", "10", "95", "2026-11-13T15:00:00Z", "1"),
      ltx("BTC", "buy", "0.1", "50000", "2026-11-15T10:00:00Z"),
      ltx("AAPL", "sell", "4", "108", "2026-11-16T18:00:00Z", "0.5"),
    ];
    const points = valueSeries(txs, closes, dayRange("2026-11-13", "2026-11-17"));
    expect(points.map((p) => [p.day, str(p.value), str(p.flow)])).toEqual([
      ["2026-11-13", "1000", "951"], // 10 × 100; bought for 950 + 1 fee
      ["2026-11-14", "1000", "0"], // Saturday: Friday's close
      ["2026-11-15", "6100", "5000"], // + 0.1 × 51000
      ["2026-11-16", "5560", "-431.5"], // 6 × 110 + 0.1 × 49000; sold 4 × 108 − 0.5
      ["2026-11-17", "5830", "0"], // 6 × 105 + 0.1 × 52000
    ]);
  });

  it("reports held assets that have no close yet and leaves them out", () => {
    const txs = [ltx("NEW", "buy", "1", "10", "2026-11-13T12:00:00Z")];
    const [point] = valueSeries(txs, closes, ["2026-11-13"]);
    expect(str(point.value)).toBe("0");
    expect(point.missing).toEqual(["NEW"]);
  });

  it("counts rewards as quantity (their fee as money in) and dividends as money out", () => {
    const txs = [
      ltx("AAPL", "buy", "1", "100", "2026-11-13T12:00:00Z"),
      ltx("AAPL", "reward", "1", "0", "2026-11-16T12:00:00Z", "2"),
      ltx("AAPL", "dividend", "1", "3", "2026-11-17T12:00:00Z", "0.45"),
    ];
    const points = valueSeries(txs, closes, ["2026-11-16", "2026-11-17"]);
    expect(points.map((p) => [str(p.value), str(p.flow)])).toEqual([
      ["220", "102"], // 2 × 110; the first day also takes the earlier buy
      ["210", "-2.55"], // 2 × 105; dividend 3 − 0.45 received
    ]);
  });
});

describe("periodChange", () => {
  const point = (value: string, flow = "0") => ({
    value: new Dec(value),
    flow: new Dec(flow),
  });

  it("does not count money put in as gain", () => {
    // $10,000, buy $2,000 more, the market falls 5 %: ends at $11,400.
    const { change, changePct } = periodChange([point("10000"), point("11400", "2000")]);
    expect(str(change)).toBe("-600");
    expect(str(changePct!)).toBe("-0.05");
  });

  it("does not count money taken out as loss", () => {
    const { change } = periodChange([point("10000"), point("9500", "-1000")]);
    expect(str(change)).toBe("500");
  });

  it("ignores the first day's flow and needs two points", () => {
    expect(str(periodChange([point("100", "100"), point("110")]).change)).toBe("10");
    expect(periodChange([point("100")]).changePct).toBeNull();
    expect(periodChange([point("0"), point("0")]).changePct).toBeNull();
  });
});

describe("priceChange", () => {
  it("compares the last close with the first", () => {
    const { change, changePct } = priceChange([{ close: new Dec("200") }, { close: new Dec("150") }]);
    expect(str(change)).toBe("-50");
    expect(str(changePct!)).toBe("-0.25");
  });
});
