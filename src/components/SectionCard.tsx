import { ArrowUpRight, type LucideIcon } from "lucide-react";
import { Link } from "@/i18n/navigation";

interface SectionCardProps {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
  /** Label for the bottom call to action ("Open"). */
  cta: string;
  /** Optional small label next to the icon, e.g. "Coming soon". */
  badge?: string;
  /** Paused sections render dimmer so the active one stands out. */
  muted?: boolean;
}

/** Big clickable card on the landing page that leads to one section of The Wire. */
export default function SectionCard({
  href,
  icon: Icon,
  title,
  description,
  cta,
  badge,
  muted = false,
}: SectionCardProps) {
  return (
    <Link
      href={href}
      className={`group flex min-h-56 flex-col rounded-2xl border border-line bg-surface p-6 transition-colors hover:border-line-strong hover:bg-surface-hover sm:p-8 ${
        muted ? "opacity-60 hover:opacity-100" : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="flex size-10 items-center justify-center rounded-xl border border-line-strong text-fg">
          <Icon size={18} strokeWidth={1.5} aria-hidden="true" />
        </span>
        {badge && (
          <span className="rounded-full border border-line px-3 py-1 text-xs text-muted">
            {badge}
          </span>
        )}
      </div>

      <h2 className="mt-6 text-xl font-bold text-fg sm:text-2xl">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-body">{description}</p>

      <span className="mt-auto flex items-center gap-1 pt-6 text-sm font-medium text-fg">
        {cta}
        <ArrowUpRight
          size={16}
          strokeWidth={1.5}
          aria-hidden="true"
          className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
        />
      </span>
    </Link>
  );
}
