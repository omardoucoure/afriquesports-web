import { defineRouting } from "next-intl/routing";
import { locales, defaultLocale } from "./config";

export const routing = defineRouting({
  // A list of all locales that are supported
  locales,

  // Used when no locale matches
  defaultLocale,

  // Don't add locale prefix for default locale (French)
  localePrefix: "as-needed",

  // Disable automatic locale detection from browser
  // Users can manually switch using the language switcher or see a modal
  localeDetection: false,
});
