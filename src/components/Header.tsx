import Link from "next/link";

/**
 * Sticky top bar with a glass effect (semi-transparent background + blur).
 * The language / country / currency pills are visual placeholders for now:
 * they become real selectors in steps 3 and 8.
 */
export default function Header() {
  const placeholders = ["EN", "Global", "USD"];

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-bg/70 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-4 sm:px-6">
        <Link href="/" className="text-sm font-bold tracking-[0.3em] text-fg">
          THE WIRE
        </Link>

        <div className="flex items-center gap-2">
          {placeholders.map((label) => (
            <span
              key={label}
              title="Coming soon"
              className="rounded-xl border border-line-strong px-3 py-1.5 text-xs font-medium text-body"
            >
              {label}
            </span>
          ))}
        </div>
      </div>
    </header>
  );
}
