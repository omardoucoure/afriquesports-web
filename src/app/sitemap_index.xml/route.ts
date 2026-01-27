import { NextResponse } from 'next/server';

/**
 * Sitemap Index Redirect
 *
 * Some SEO tools expect /sitemap_index.xml as the main sitemap.
 * This redirects to /sitemap.xml which is the actual sitemap index.
 */

export async function GET() {
  // Redirect to the main sitemap using production URL
  return NextResponse.redirect('https://www.afriquesports.net/sitemap.xml', 301);
}
