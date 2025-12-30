import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware to fix malformed URLs and improve Google indexing
 *
 * Fixes patterns like:
 * - /en/https:/article-slug → /en/football/article-slug
 * - /https:/article-slug → /football/article-slug
 */
export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const pathname = url.pathname;

  // Pattern 1: Locale + https:/ (e.g., /en/https:/article-slug)
  const localeHttpsPattern = /^\/([a-z]{2})\/(https:\/)?(.+)$/;
  const localeMatch = pathname.match(localeHttpsPattern);

  if (localeMatch && localeMatch[2]) {
    const locale = localeMatch[1];
    const slug = localeMatch[3];

    // Redirect to proper URL with football category
    url.pathname = `/${locale}/football/${slug}`;

    console.log(`[Middleware] Redirecting malformed URL:`, {
      from: pathname,
      to: url.pathname,
    });

    return NextResponse.redirect(url, 301); // Permanent redirect
  }

  // Pattern 2: No locale + https:/ (e.g., /https:/article-slug)
  const httpsPrefixPattern = /^\/(https:\/)?(.+)$/;
  const httpsPrefixMatch = pathname.match(httpsPrefixPattern);

  if (httpsPrefixMatch && httpsPrefixMatch[1]) {
    const slug = httpsPrefixMatch[2];

    // Redirect to proper URL with football category (French default)
    url.pathname = `/football/${slug}`;

    console.log(`[Middleware] Redirecting malformed URL:`, {
      from: pathname,
      to: url.pathname,
    });

    return NextResponse.redirect(url, 301); // Permanent redirect
  }

  // No redirect needed
  return NextResponse.next();
}

// Configure which paths should be processed by middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - robots.txt (robots file)
     * - sitemap.xml (sitemap files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap).*)',
  ],
};
