import { NextRequest, NextResponse } from 'next/server';

// Valid locale codes
const locales = ['fr', 'en', 'es', 'ar'] as const;
const defaultLocale = 'fr';

// Paths that should bypass middleware
const BYPASS_PATHS = [
  '/api/',
  '/_next/',
  '/favicon',
  '/robots',
  '/sitemap',
  '/manifest',
  '/opengraph-image',
  '/apple-icon',
  '/icon',
  '/video-sitemap',
  '/news-sitemap',
  '/admin/',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip bypass paths (API routes, static files, sitemaps)
  if (BYPASS_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Skip files with extensions
  if (pathname.includes('.') && /\.(jpg|jpeg|png|gif|svg|ico|webp|css|js|woff|woff2|ttf|eot|map|xml|txt|json)$/i.test(pathname)) {
    return NextResponse.next();
  }

  // Extract first segment (potential locale)
  const segments = pathname.split('/').filter(Boolean);
  const firstSegment = segments[0] || '';

  // If first segment is a valid locale (en, es, ar), let it through
  if (locales.includes(firstSegment as any) && firstSegment !== defaultLocale) {
    return NextResponse.next();
  }

  // If first segment is 'fr' locale, let it through
  if (firstSegment === defaultLocale) {
    return NextResponse.next();
  }

  // For all other paths (no locale or invalid locale):
  // Rewrite to /fr/{path} internally while keeping URL clean
  // This ensures French content is at /{category}/{slug} without /fr/ prefix
  const url = request.nextUrl.clone();
  url.pathname = `/${defaultLocale}${pathname === '/' ? '' : pathname}`;

  return NextResponse.rewrite(url);
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, robots.txt, etc.
     */
    '/((?!_next/static|_next/image).*)',
  ],
};
