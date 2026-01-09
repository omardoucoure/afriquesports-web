import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

/**
 * Legacy OG Image endpoint - redirects to new og-can2025
 * Kept for backwards compatibility with cached URLs
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const matchId = searchParams.get('id');

  if (!matchId) {
    return new Response('Match ID required', { status: 400 });
  }

  // Redirect to the new static OG endpoint
  // Use default team names since we don't have them without API call
  const newUrl = new URL('/api/og-can2025', request.url);
  newUrl.searchParams.set('home', 'Team A');
  newUrl.searchParams.set('away', 'Team B');
  newUrl.searchParams.set('score', '0-0');
  newUrl.searchParams.set('live', 'false');

  return NextResponse.redirect(newUrl, { status: 307 });
}
