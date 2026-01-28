import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from '@/i18n/routing';

// Paths that should bypass i18n middleware entirely
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
  '/dashboard/',
  '/images/',
  '/fonts/',
  '/logo',
  '/firebase-messaging-sw.js',
  '/sw.js',
  '/serviceworker.js',
];

// Create the next-intl middleware
const intlMiddleware = createMiddleware(routing);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip bypass paths (API routes, static files, sitemaps)
  if (BYPASS_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Skip files with extensions
  if (pathname.includes('.') && /\.(jpg|jpeg|png|gif|svg|ico|webp|css|js|woff|woff2|ttf|eot|map|xml|txt|json|webmanifest)$/i.test(pathname)) {
    return NextResponse.next();
  }

  // Use next-intl middleware for locale handling
  return intlMiddleware(request);
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     */
    '/((?!_next/static|_next/image).*)',
  ],
};
