/** The portfolio sections with their own dashboard (decision 92). */
export const SECTIONS = ["overview", "crypto", "stocks"] as const;
export type Section = (typeof SECTIONS)[number];

/** Which asset classes each section shows (decision 84). */
export const SECTION_CLASSES: Record<Section, readonly string[]> = {
  overview: ["stock", "etf", "crypto"],
  crypto: ["crypto"],
  stocks: ["stock", "etf"],
};

export function isSection(value: unknown): value is Section {
  return typeof value === "string" && (SECTIONS as readonly string[]).includes(value);
}
