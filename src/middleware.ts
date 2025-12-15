import createMiddleware from "next-intl/middleware";
import { locales, defaultLocale } from "./i18n/config";

export default createMiddleware({
  // A list of all locales that are supported
  locales,

  // Used when no locale matches
  defaultLocale,

  // Don't add locale prefix for default locale (French)
  localePrefix: "as-needed",

  // Disable automatic locale detection from browser
  // Users can manually switch using the language switcher
  localeDetection: false,
});

export const config = {
  // Match all pathnames except for
  // - /api routes
  // - /_next (Next.js internals)
  // - /_vercel (Vercel internals)
  // - /static (public files)
  // - all root files (favicon.ico, robots.txt, etc.)
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
