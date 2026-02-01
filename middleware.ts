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
  '/post-sitemap', // Added: catches post-sitemap1.xml, post-sitemap2.xml, etc.
  '/page-sitemap',
  '/category-sitemap',
  '/admin/',
  '/dashboard/',
  '/images/',
  '/fonts/',
  '/logo',
  '/firebase-messaging-sw.js',
  '/sw.js',
  '/serviceworker.js',
  '/wp-admin',
  '/wp-login',
  '/wp-content',
  '/wp-includes',
  '/wp-json',
  '/app-ads.txt',
  '/ads.txt',
];

// Create the next-intl middleware
const intlMiddleware = createMiddleware(routing);

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip bypass paths (API routes, static files, sitemaps)
  if (BYPASS_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Skip files with extensions (including .php for WordPress)
  // This catches all static files: images, fonts, sitemaps, configs, etc.
  if (pathname.includes('.') && /\.(jpg|jpeg|png|gif|svg|ico|webp|css|js|woff|woff2|ttf|eot|map|xml|txt|json|webmanifest|php|pdf|zip)$/i.test(pathname)) {
    return NextResponse.next();
  }

  // Skip root-level sitemap files (post-sitemap1.xml, video-sitemap2.xml, etc.)
  // These don't start with /sitemap but are sitemap files
  if (/^\/(post|page|category|video|news|author|tag)-sitemap\d*\.xml$/i.test(pathname)) {
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
