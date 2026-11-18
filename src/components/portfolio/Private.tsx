/**
 * Wraps an amount of money or a quantity so the "Hide amounts" switch can
 * mask it (decision 100). The masking is pure CSS (globals.css): while
 * <html data-privacy="on"> is set, the value is hidden and "••••••" shows
 * in its place, in the same font. Works in Server and Client Components.
 * Percentages and market prices are never wrapped: they don't reveal how
 * much someone has.
 */
export default function Private({ children }: { children: React.ReactNode }) {
  return (
    <span className="private">
      <span className="private-value">{children}</span>
    </span>
  );
}

/** localStorage key and <html> attribute of the switch. */
export const PRIVACY_KEY = "the-wire:privacy";
export const PRIVACY_ATTR = "data-privacy";

/**
 * Runs in <head> before the first paint, so hidden amounts never flash on a
 * page load (Next.js guide "Preventing flash before hydration").
 */
export const PRIVACY_SCRIPT = `(function(){try{if(localStorage.getItem("${PRIVACY_KEY}")==="on")document.documentElement.setAttribute("${PRIVACY_ATTR}","on")}catch(e){}})()`;
