import { NextResponse } from 'next/server';

const SITE_URL = "https://www.afriquesports.net";

export const runtime = 'edge';
export const revalidate = 3600; // Revalidate every hour

/**
 * CAN 2025 Matches Sitemap
 *
 * Features:
 * - Priority 1.0 for live matches
 * - Priority 0.9 for upcoming matches (< 24hrs)
 * - Priority 0.7 for finished matches
 * - changefreq: always (live), hourly (upcoming), never (finished)
 * - hreflang alternates for all locales (fr, en, es, ar)
 * - lastmod based on score updates
 */

async function getAllMatches() {
  try {
    const response = await fetch(
      'https://site.api.espn.com/apis/site/v2/sports/soccer/caf.nations/scoreboard',
      {
        next: { revalidate: 3600 }
      }
    );

    if (!response.ok) {
      console.error('ESPN API error:', response.status);
      return [];
    }

    const data = await response.json();
    return data.events || [];
  } catch (error) {
    console.error('Error fetching matches:', error);
    return [];
  }
}

function determineMatchPriority(match: any): number {
  const status = match.status?.type?.state;
  const matchDate = new Date(match.date);
  const now = new Date();
  const hoursUntilMatch = (matchDate.getTime() - now.getTime()) / (1000 * 60 * 60);

  // Live matches: highest priority
  if (status === 'in') {
    return 1.0;
  }

  // Upcoming matches within 24 hours: high priority
  if (hoursUntilMatch > 0 && hoursUntilMatch < 24) {
    return 0.9;
  }

  // Upcoming matches beyond 24 hours
  if (hoursUntilMatch >= 24) {
    return 0.8;
  }

  // Finished matches: lower priority
  return 0.7;
}

function determineChangeFreq(match: any): string {
  const status = match.status?.type?.state;
  const matchDate = new Date(match.date);
  const now = new Date();
  const hoursUntilMatch = (matchDate.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (status === 'in') {
    return 'always'; // Live matches update constantly
  }

  if (hoursUntilMatch > 0 && hoursUntilMatch < 24) {
    return 'hourly'; // Upcoming matches update frequently
  }

  if (hoursUntilMatch >= 24) {
    return 'daily'; // Future matches update less frequently
  }

  return 'never'; // Finished matches don't change
}

export async function GET() {
  try {
    const matches = await getAllMatches();

    const urlEntries = matches.map((match: any) => {
      const matchId = match.id;
      const priority = determineMatchPriority(match);
      const changefreq = determineChangeFreq(match);
      const lastmod = match.status?.type?.completed
        ? new Date(match.date).toISOString()
        : new Date().toISOString();

      // In production, French (default locale) has no prefix due to localePrefix: "as-needed"
      const frenchUrl = `${SITE_URL}/can-2025/match/${matchId}`;

      return `
    <url>
      <loc>${frenchUrl}</loc>
      <lastmod>${lastmod}</lastmod>
      <changefreq>${changefreq}</changefreq>
      <priority>${priority.toFixed(1)}</priority>
      <xhtml:link
        rel="alternate"
        hreflang="fr"
        href="${frenchUrl}" />
      <xhtml:link
        rel="alternate"
        hreflang="en"
        href="${SITE_URL}/en/can-2025/match/${matchId}" />
      <xhtml:link
        rel="alternate"
        hreflang="es"
        href="${SITE_URL}/es/can-2025/match/${matchId}" />
      <xhtml:link
        rel="alternate"
        hreflang="ar"
        href="${SITE_URL}/ar/can-2025/match/${matchId}" />
      <xhtml:link
        rel="alternate"
        hreflang="x-default"
        href="${frenchUrl}" />
    </url>`;
    }).join('');

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
  ${urlEntries}
</urlset>`;

    return new NextResponse(sitemap, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        'CDN-Cache-Control': 'public, s-maxage=3600',
      }
    });
  } catch (error) {
    console.error('Error generating matches sitemap:', error);
    return new NextResponse('Error generating sitemap', { status: 500 });
  }
}
