"use client";

import { useSyncExternalStore } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { PRIVACY_ATTR, PRIVACY_KEY } from "./Private";

const EVENT = "the-wire:privacy-change";

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange); // another tab switched it
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

const isOn = () => document.documentElement.getAttribute(PRIVACY_ATTR) === "on";

/** Whether amounts are hidden right now. Always false on the server. */
export function usePrivacy(): boolean {
  return useSyncExternalStore(subscribe, isOn, () => false);
}

function setPrivacy(on: boolean) {
  if (on) document.documentElement.setAttribute(PRIVACY_ATTR, "on");
  else document.documentElement.removeAttribute(PRIVACY_ATTR);
  try {
    localStorage.setItem(PRIVACY_KEY, on ? "on" : "off");
  } catch {
    // Private window or blocked storage: the switch still works for this visit.
  }
  window.dispatchEvent(new Event(EVENT));
}

/** Eye button in the portfolio sub-bar: hides or shows every amount (decision 100). */
export default function PrivacyToggle() {
  const t = useTranslations("Portfolio.privacy");
  const hidden = usePrivacy();
  const Icon = hidden ? EyeOff : Eye;

  return (
    <button
      type="button"
      onClick={() => setPrivacy(!hidden)}
      aria-pressed={hidden}
      aria-label={t(hidden ? "showLabel" : "hideLabel")}
      title={t(hidden ? "showLabel" : "hideLabel")}
      className={`inline-flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-sm transition-colors ${
        hidden ? "border-accent text-accent" : "border-line-strong text-muted hover:border-accent hover:text-fg"
      }`}
    >
      <Icon size={16} strokeWidth={1.75} aria-hidden="true" />
      <span className="hidden md:inline">{t(hidden ? "show" : "hide")}</span>
    </button>
  );
}
