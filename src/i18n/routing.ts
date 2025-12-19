import { defineRouting } from "next-intl/routing";
import { locales, defaultLocale } from "./config";

// Use "always" in dev for Next.js 16 compatibility, "as-needed" in prod for SEO
const isDev = process.env.NODE_ENV === "development";

export const routing = defineRouting({
  // A list of all locales that are supported
  locales,

  // Used when no locale matches
  defaultLocale,

  // Dev: use "always" for Next.js 16 compatibility
  // Prod: use "as-needed" to keep French at root (no /fr prefix) for SEO
  localePrefix: isDev ? "always" : "as-needed",
});
