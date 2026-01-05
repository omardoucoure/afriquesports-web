import { NextRequest, NextResponse } from 'next/server';

// Valid locale codes for the application
const VALID_LOCALES = ['fr', 'en', 'es', 'ar'] as const;
const DEFAULT_LOCALE = 'fr';

// File extensions that should not be treated as locales
const FILE_EXTENSIONS = /\.(avi|mp4|webm|mov|flv|wmv|mkv|png|jpg|jpeg|gif|webp|svg|ico|pdf|txt|json|xml|css|js|woff|woff2|ttf|eot|map)$/i;

// Static paths that should not be intercepted
const STATIC_PATHS = [
  '/api/',
  '/_next/',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
  '/manifest.json',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static paths and API routes
  if (STATIC_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Extract the first segment of the path (potential locale)
  const segments = pathname.split('/').filter(Boolean);
  const firstSegment = segments[0] || '';

  // Handle root path - rewrite to French locale WITHOUT redirect (SEO friendly)
  if (pathname === '/' || pathname === '') {
    const url = request.nextUrl.clone();
    url.pathname = `/${DEFAULT_LOCALE}`;
    // Use rewrite instead of redirect to serve French content at / without changing URL
    return NextResponse.rewrite(url);
  }

  // Check if first segment looks like a file (contains a dot and matches file extension pattern)
  if (firstSegment.includes('.')) {
    // Check if it's a known file extension
    if (FILE_EXTENSIONS.test(firstSegment)) {
      console.warn(
        `[Middleware] ⚠️ File detected in locale position: ${firstSegment} - Path: ${pathname}`
      );

      // Return 404 for files in the wrong place
      // This prevents the database from trying to query "locale=file.avi"
      return new NextResponse(null, { status: 404 });
    }
  }

  // If first segment exists but is not a valid locale
  if (firstSegment && !VALID_LOCALES.includes(firstSegment as any)) {
    // Could be a file or invalid route
    console.warn(
      `[Middleware] ⚠️ Invalid locale detected: "${firstSegment}" - Redirecting to /${DEFAULT_LOCALE}${pathname}`
    );

    // Redirect to default locale
    const url = request.nextUrl.clone();
    url.pathname = `/${DEFAULT_LOCALE}${pathname}`;
    return NextResponse.redirect(url);
  }

  // Valid locale - continue
  return NextResponse.next();
}

export const config = {
  // Match all paths except:
  // - API routes
  // - Static files in public/
  // - Next.js internal files
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
