import { describe, expect, it } from "vitest";
import { isLocale, parseSettings } from "./parse";

const form = (values: Record<string, string>) =>
  new Map(Object.entries(values));

describe("parseSettings", () => {
  it("accepts a language, a country and one of its time zones", () => {
    expect(
      parseSettings(
        form({ locale: "es", country: "dk", timeZone: "Europe/Copenhagen" }),
      ),
    ).toEqual({
      ok: true,
      value: { locale: "es", country: "DK", timeZone: "Europe/Copenhagen" },
    });
  });

  it("asks for every field", () => {
    expect(parseSettings(form({}))).toEqual({
      ok: false,
      errors: { locale: "required", country: "required", timeZone: "required" },
    });
  });

  it("rejects an unknown language or a zone from another country", () => {
    expect(
      parseSettings(
        form({ locale: "fr", country: "DK", timeZone: "Europe/Madrid" }),
      ),
    ).toEqual({
      ok: false,
      errors: { locale: "invalid", timeZone: "invalid" },
    });
  });

  it("rejects a malformed country", () => {
    expect(
      parseSettings(
        form({ locale: "en", country: "DNK", timeZone: "Europe/Copenhagen" }),
      ),
    ).toEqual({
      ok: false,
      errors: { country: "invalid" },
    });
  });
});

describe("isLocale", () => {
  it("knows the two languages", () => {
    expect(isLocale("en")).toBe(true);
    expect(isLocale("es")).toBe(true);
    expect(isLocale("fr")).toBe(false);
    expect(isLocale(undefined)).toBe(false);
  });
});
