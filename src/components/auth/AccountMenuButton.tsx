"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ChartPie, LogOut, Settings } from "lucide-react";
import { useTranslations } from "next-intl";
import { signOut } from "@/app/auth/actions";
import { Link } from "@/i18n/navigation";

interface AccountMenuButtonProps {
  email: string | null;
  locale: string;
}

/** Round avatar with the user's initial; opens a small account menu. */
export default function AccountMenuButton({ email, locale }: AccountMenuButtonProps) {
  const t = useTranslations("Header.account");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const initial = email?.trim().charAt(0).toUpperCase() || "?";

  // Close when clicking outside the menu or pressing Escape.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label={t("menu")}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
        className="flex size-8 items-center justify-center rounded-full bg-accent sm:size-9 text-sm font-semibold text-accent-ink transition-opacity hover:opacity-90"
      >
        {initial}
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 mt-2 w-64 rounded-2xl border border-line-strong bg-surface p-2 shadow-2xl shadow-black/60"
        >
          {email && (
            <p className="truncate px-3 pt-2 pb-3 text-xs text-muted" title={email}>
              {t("signedInAs")}
              <span className="mt-0.5 block truncate text-sm text-fg">{email}</span>
            </p>
          )}
          <Link
            href="/portfolio"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-body hover:bg-surface-hover hover:text-fg"
          >
            <ChartPie size={16} strokeWidth={1.5} aria-hidden="true" />
            {t("portfolio")}
          </Link>
          <Link
            href="/settings"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-body hover:bg-surface-hover hover:text-fg"
          >
            <Settings size={16} strokeWidth={1.5} aria-hidden="true" />
            {t("settings")}
          </Link>
          <form action={signOut.bind(null, locale)}>
            <button
              type="submit"
              role="menuitem"
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-body hover:bg-surface-hover hover:text-fg"
            >
              <LogOut size={16} strokeWidth={1.5} aria-hidden="true" />
              {t("signOut")}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
