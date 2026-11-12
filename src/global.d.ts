import type { routing } from "@/i18n/routing";
import type messages from "../messages/en.json";

/*
 * Tells next-intl the exact shape of our messages and locales,
 * so TypeScript flags unknown translation keys or locales as errors.
 */
declare module "next-intl" {
  interface AppConfig {
    Locale: (typeof routing.locales)[number];
    Messages: typeof messages;
  }
}
