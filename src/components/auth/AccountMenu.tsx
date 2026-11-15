import { UserRound } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getOptionalUser } from "@/lib/auth";
import AccountMenuButton from "./AccountMenuButton";

/**
 * Right side of the header: "Sign in" when signed out, an avatar menu when
 * signed in. Reads the session, so Header renders it inside <Suspense>.
 */
export default async function AccountMenu() {
  const user = await getOptionalUser();
  const t = await getTranslations("Header.account");

  if (!user) {
    return (
      <Link
        href="/login"
        aria-label={t("signIn")}
        className="flex h-8 items-center gap-2 rounded-full border border-line-strong px-1.5 text-sm text-body transition-colors hover:bg-surface-hover hover:text-fg sm:h-9 sm:px-3"
      >
        <UserRound size={18} strokeWidth={1.5} aria-hidden="true" />
        <span className="hidden sm:inline">{t("signIn")}</span>
      </Link>
    );
  }

  return <AccountMenuButton email={user.email} locale={await getLocale()} />;
}

/** Same size as the avatar, so the header doesn't jump while the session loads. */
export function AccountMenuSkeleton() {
  return <span aria-hidden="true" className="block size-8 rounded-full border border-line sm:size-9" />;
}
