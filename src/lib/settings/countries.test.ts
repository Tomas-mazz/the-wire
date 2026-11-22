import { describe, expect, it } from "vitest";
import { countryForZone, groupZones, listCountries, regionTimeZones, zoneBelongsTo } from "./countries";

const NOW = Date.UTC(2026, 10, 18, 12); // a November day: northern winter time

describe("regionTimeZones", () => {
  it("lists the zones of a country and nothing for a bad code", () => {
    expect(regionTimeZones("DK")).toEqual(["Europe/Copenhagen"]);
    expect(regionTimeZones("US").length).toBeGreaterThan(10);
    expect(regionTimeZones("dk")).toEqual([]);
    expect(regionTimeZones("XX")).toEqual([]);
  });
});

describe("groupZones", () => {
  it("turns a country with one clock into one choice", () => {
    const ar = groupZones(regionTimeZones("AR"), "es", NOW);
    expect(ar).toHaveLength(1);
    expect(ar[0].label).toBe("Hora estándar de Argentina (GMT−3)");
  });

  it("splits Spain into the mainland and the Canary Islands, west first", () => {
    const es = groupZones(regionTimeZones("ES"), "en", NOW);
    expect(es.map((z) => z.id)).toEqual(["Atlantic/Canary", "Europe/Madrid"]);
    expect(es[1].label).toBe("Central European Time (GMT+1)");
  });

  it("gives the US its familiar clocks with well-known cities", () => {
    const us = groupZones(regionTimeZones("US"), "en", NOW);
    const ids = us.map((z) => z.id);
    expect(ids).toContain("America/New_York");
    expect(ids).toContain("America/Chicago");
    expect(ids).toContain("America/Los_Angeles");
    expect(ids).toContain("America/Phoenix");
    expect(us.find((z) => z.id === "America/New_York")?.label).toBe("Eastern Time (GMT−5)");
    expect(new Set(us.map((z) => z.label)).size).toBe(us.length);
  });

  it("keeps the saved zone as its group's choice", () => {
    const us = groupZones(regionTimeZones("US"), "en", NOW, "America/Detroit");
    expect(us.map((z) => z.id)).toContain("America/Detroit");
    expect(us.map((z) => z.id)).not.toContain("America/New_York");
  });
});

describe("listCountries", () => {
  const countries = listCountries("es", NOW);

  it("names countries in the user's language, sorted, without unnamed codes", () => {
    expect(countries.find((c) => c.code === "DK")?.name).toBe("Dinamarca");
    expect(countries.some((c) => c.code === "CT")).toBe(false);
    const names = countries.map((c) => c.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, "es")));
    expect(countries.length).toBeGreaterThan(200);
  });
});

describe("countryForZone / zoneBelongsTo", () => {
  it("finds the country of a saved zone", () => {
    expect(countryForZone("Europe/Copenhagen")).toBe("DK");
    expect(countryForZone("America/Argentina/Buenos_Aires")).toBe("AR");
    expect(countryForZone(null)).toBeNull();
    expect(countryForZone("Not/AZone")).toBeNull();
  });

  it("accepts any member of the country, not only the listed choice", () => {
    expect(zoneBelongsTo("America/Detroit", "US")).toBe(true);
    expect(zoneBelongsTo("Europe/Madrid", "DK")).toBe(false);
  });
});

describe("zone aliases", () => {
  it("treats the old and new spellings of a zone as the same", () => {
    expect(zoneBelongsTo("Europe/Kyiv", "UA")).toBe(true);
    const ar = groupZones(regionTimeZones("AR"), "es", NOW, "America/Argentina/Buenos_Aires");
    expect(ar.map((z) => z.id)).toEqual(["America/Argentina/Buenos_Aires"]);
  });
});
