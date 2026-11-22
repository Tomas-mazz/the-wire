/**
 * Countries and their time zones for the settings page (decision 112).
 * Pure: everything comes from the ICU data built into Node's Intl, so there is
 * no hand-made list to keep up to date. Call it on the server: browsers don't
 * all expose a country's time zones (Intl.Locale#getTimeZones).
 */

export interface ZoneChoice {
  /** IANA name that gets saved, e.g. "America/New_York". */
  id: string;
  /** "Eastern Time (GMT−5)" in the user's language. */
  label: string;
}

export interface CountryChoice {
  /** ISO 3166-1 alpha-2, e.g. "DK". */
  code: string;
  name: string;
  /** One entry per distinct clock (see groupZones). */
  zones: ZoneChoice[];
}

/** Every IANA time zone ICU lists for a country ("US" → 29 names). */
export function regionTimeZones(code: string): string[] {
  if (!/^[A-Z]{2}$/.test(code)) return [];
  try {
    const locale = new Intl.Locale(`und-${code}`) as Intl.Locale & {
      getTimeZones?: () => string[];
      timeZones?: string[];
    };
    return locale.getTimeZones?.() ?? locale.timeZones ?? [];
  } catch {
    return [];
  }
}

/**
 * ICU's own spelling of a zone, so aliases compare equal: browsers may report
 * "America/Argentina/Buenos_Aires" or "Europe/Kyiv" while the country lists
 * use "America/Buenos_Aires" and "Europe/Kiev". Unknown names come back as is.
 */
export function canonicalZone(zone: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: zone,
    }).resolvedOptions().timeZone;
  } catch {
    return zone;
  }
}

/** True when two names are the same zone (aliases included). */
function sameZone(a: string, b: string): boolean {
  return a === b || canonicalZone(a) === canonicalZone(b);
}

/**
 * The zone saved for well-known clocks, so the transaction form's hint reads
 * "America/New_York" rather than "America/Detroit". Display only: every zone
 * in a group shows the same time today.
 */
const PREFERRED = new Set([
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Anchorage",
  "America/Argentina/Buenos_Aires",
  "America/Buenos_Aires",
  "America/Sao_Paulo",
  "America/Mexico_City",
  "America/Toronto",
  "America/Vancouver",
  "Australia/Sydney",
  "Europe/Madrid",
  "Europe/Lisbon",
]);

/** "GMT+01:00" at that instant ("GMT" when the offset is zero). */
function offsetAt(zone: string, instant: number): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    timeZoneName: "longOffset",
  }).formatToParts(instant);
  return parts.find((p) => p.type === "timeZoneName")?.value ?? "GMT";
}

/** "GMT+01:00" → 60, "GMT-03:30" → -210, "GMT" → 0. */
function offsetMinutes(offset: string): number {
  const m = offset.match(/^GMT([+-])(\d{2}):(\d{2})$/);
  return m ? (m[1] === "-" ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3])) : 0;
}

/** "GMT+01:00" → "GMT+1", "GMT-03:30" → "GMT−3:30", "GMT" stays. */
function shortOffset(offset: string): string {
  const m = offset.match(/^GMT([+-])(\d{2}):(\d{2})$/);
  if (!m) return "GMT";
  return `GMT${m[1] === "-" ? "−" : "+"}${Number(m[2])}${m[3] === "00" ? "" : `:${m[3]}`}`;
}

/** "Hora oriental" / "Eastern Time" at that instant. */
function genericName(zone: string, locale: string, instant: number): string {
  const parts = new Intl.DateTimeFormat(locale, {
    timeZone: zone,
    timeZoneName: "longGeneric",
  }).formatToParts(instant);
  const name = parts.find((p) => p.type === "timeZoneName")?.value ?? zone;
  return name.charAt(0).toLocaleUpperCase(locale) + name.slice(1);
}

/**
 * Collapses a country's zones into the clocks a person would recognise:
 * zones with the same offset in mid-January and mid-July of this year (so the
 * same daylight saving too) are one choice. Argentina's 12 names become one
 * "Argentina Time"; the US becomes Eastern, Central, Mountain, Arizona…
 * `keep` (the saved zone, in its own spelling) represents its group, so the
 * form shows it selected and saving again changes nothing.
 * Groups go from west to east (by January offset).
 */
export function groupZones(
  zones: readonly string[],
  locale: string,
  now: number,
  keep?: string | null,
): ZoneChoice[] {
  const year = new Date(now).getUTCFullYear();
  const january = Date.UTC(year, 0, 15);
  const july = Date.UTC(year, 6, 15);

  const groups = new Map<string, { winter: number; members: string[] }>();
  for (const zone of zones) {
    const winter = offsetAt(zone, january);
    const key = `${winter}|${offsetAt(zone, july)}`;
    const group = groups.get(key) ?? {
      winter: offsetMinutes(winter),
      members: [],
    };
    group.members.push(zone);
    groups.set(key, group);
  }

  const choices = [...groups.values()]
    .sort((a, b) => a.winter - b.winter)
    .map(({ members }) => {
      const kept =
        keep && members.some((z) => sameZone(z, keep)) ? keep : undefined;
      const id =
        kept ?? members.find((z) => PREFERRED.has(z)) ?? [...members].sort()[0];
      return {
        id,
        name: genericName(id, locale, now),
        offset: shortOffset(offsetAt(id, now)),
      };
    });

  // Two clocks with the same name (e.g. Mountain Time with and without
  // daylight saving) get their city added so they can be told apart.
  const counts = new Map<string, number>();
  for (const c of choices) counts.set(c.name, (counts.get(c.name) ?? 0) + 1);
  return choices.map(({ id, name, offset }) => {
    const city = (id.split("/").pop() ?? id).replaceAll("_", " ");
    const label = (counts.get(name) ?? 0) > 1 ? `${name} · ${city}` : name;
    return { id, label: `${label} (${offset})` };
  });
}

/** Every country ICU knows with at least one time zone, sorted by name in `locale`. */
export function listCountries(
  locale: string,
  now: number,
  savedZone?: string | null,
): CountryChoice[] {
  const names = new Intl.DisplayNames([locale], {
    type: "region",
    fallback: "code",
  });
  const countries: CountryChoice[] = [];
  for (let a = 65; a <= 90; a++) {
    for (let b = 65; b <= 90; b++) {
      const code = String.fromCharCode(a, b);
      const zones = regionTimeZones(code);
      const name = names.of(code);
      // Old or reserved codes (e.g. "CT") have zones but no name.
      if (zones.length === 0 || !name || name === code) continue;
      countries.push({
        code,
        name,
        zones: groupZones(zones, locale, now, savedZone),
      });
    }
  }
  return countries.sort((x, y) => x.name.localeCompare(y.name, locale));
}

/** The country a zone belongs to ("Europe/Copenhagen" → "DK"), for a first guess. */
export function countryForZone(zone: string | null | undefined): string | null {
  if (!zone) return null;
  for (let a = 65; a <= 90; a++) {
    for (let b = 65; b <= 90; b++) {
      const code = String.fromCharCode(a, b);
      if (regionTimeZones(code).some((z) => sameZone(z, zone))) return code;
    }
  }
  return null;
}

/** True when `zone` is one of the country's zones (any member, not only the listed ones). */
export function zoneBelongsTo(zone: string, country: string): boolean {
  return regionTimeZones(country).some((z) => sameZone(z, zone));
}
