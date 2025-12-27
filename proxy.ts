import createMiddleware from 'next-intl/middleware';

// Next.js 16: Renamed from middleware.ts to proxy.ts
// Export function named 'proxy' instead of default export
//
// NOTE: Edge caching via middleware headers was attempted but doesn't work.
// Next.js overrides any Cache-Control headers set in middleware for pages with
// force-dynamic, reverting them to "private, no-cache, no-store".
// See VERCEL-COST-OPTIMIZATION-RESEARCH.md for details and alternative approaches.
export const proxy = createMiddleware({
  // A list of all locales that are supported
  locales: ['fr', 'en', 'es', 'ar'],

  // Used when no locale matches
  defaultLocale: 'fr',

  // Keep French at root (no /fr prefix) for SEO in production
  localePrefix: process.env.NODE_ENV === 'development' ? 'always' : 'as-needed',

  // CRITICAL: Disable locale detection to prevent automatic redirects
  // Users should get the language specified in the URL, not their browser preference
  localeDetection: false,
});

export const config = {
  // Match all pathnames except static files and API routes
  matcher: [
    // Match all pathnames except for:
    // - … if they start with `/api`, `/_next` or `/_vercel`
    // - … the ones containing a dot (e.g. `favicon.ico`)
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ],
};
