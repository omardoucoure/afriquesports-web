import createMiddleware from 'next-intl/middleware';
import { NextRequest } from 'next/server';

// Create next-intl middleware
const intlMiddleware = createMiddleware({
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

// Next.js 16: Export function named 'proxy' instead of default export
// Wrap next-intl middleware to add cache headers for article pages
export async function proxy(request: NextRequest) {
  // Call next-intl middleware first
  const response = await intlMiddleware(request);

  // Add edge cache headers for article pages to reduce Vercel costs
  // Article pages: /:locale?/:category/:slug (e.g., /football/some-article, /en/football/some-article)
  // Exclude special paths: /category/, /can-2025/, /api/, /admin/, etc.
  const pathname = request.nextUrl.pathname;

  // Match pattern: one or two segments (with optional locale prefix)
  // Examples that SHOULD match:
  //   /football/article-slug-123 ✓
  //   /en/football/article-slug-123 ✓
  //   /afrique/senegal-news-456 ✓
  // Examples that should NOT match:
  //   /category/football ✗ (has /category/ prefix)
  //   /can-2025/match/123 ✗ (has /can-2025/ prefix)
  //   /api/posts ✗ (API route)
  const isArticlePage = pathname.match(
    /^\/(?:fr|en|es|ar)?\/?(?!category|can-2025|api|admin|search|live-match|match-en-direct|partido-en-vivo)([^\/]+)\/([^\/]+)$/
  );

  if (isArticlePage) {
    // Set edge cache headers (5 min cache, 10 min stale-while-revalidate)
    // This works even with force-dynamic because middleware headers take precedence
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    response.headers.set('x-middleware-cache', 'HIT'); // Debug header to verify middleware runs
  }

  return response;
}

export const config = {
  // Match all pathnames except static files and API routes
  matcher: [
    // Match all pathnames except for:
    // - … if they start with `/api`, `/_next` or `/_vercel`
    // - … the ones containing a dot (e.g. `favicon.ico`)
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ],
};
