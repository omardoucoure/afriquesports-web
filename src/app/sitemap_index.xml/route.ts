import { NextRequest, NextResponse } from 'next/server';

/**
 * Sitemap Index Redirect
 *
 * Some SEO tools expect /sitemap_index.xml as the main sitemap.
 * This redirects to /sitemap.xml which is the actual sitemap index.
 */

export async function GET(request: NextRequest) {
  // Redirect to the main sitemap
  return NextResponse.redirect(new URL('/sitemap.xml', request.url), 301);
}
