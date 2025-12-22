import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { NextRequest } from "next/server";

export default function middleware(request: NextRequest) {
  // Check for locale preference cookie
  const localePreference = request.cookies.get("locale-preference")?.value;

  // Create middleware with conditional locale detection
  // If user has a cookie preference, we use it and enable detection
  // If no preference, we disable detection to prevent auto-redirect
  const intlMiddleware = createMiddleware({
    ...routing,
    // Disable automatic locale detection if no cookie is set
    // This forces the default locale (French) on first visit
    localeDetection: !!localePreference,
  });

  return intlMiddleware(request);
}

export const config = {
  // Match all pathnames except for
  // - /api routes
  // - /_next (Next.js internals)
  // - /_vercel (Vercel internals)
  // - Static files (images, fonts, etc.)
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
