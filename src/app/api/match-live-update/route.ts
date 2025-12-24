import { NextResponse } from 'next/server';
import { espnToMatchData } from '@/lib/match-schema';
import { getMatchCommentary } from '@/lib/mysql-match-db';

/**
 * Live match update API for client-side polling
 * Returns fresh match data and commentary every 15 seconds
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const matchId = searchParams.get('id');
    const locale = searchParams.get('locale') || 'fr';

    if (!matchId) {
      return NextResponse.json(
        { error: 'Match ID is required' },
        { status: 400 }
      );
    }

    // Fetch latest match data from ESPN
    const espnResponse = await fetch(
      `https://site.api.espn.com/apis/site/v2/sports/soccer/caf.nations/summary?event=${matchId}`,
      {
        next: { revalidate: 0 }, // No cache for live updates
        cache: 'no-store'
      }
    );

    if (!espnResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch match data' },
        { status: espnResponse.status }
      );
    }

    const espnData = await espnResponse.json();

    // Fetch latest commentary from MySQL
    let commentary: any[] = [];
    try {
      const data = await getMatchCommentary(matchId, locale);
      if (data) {
        // Limit to 50 most recent items
        commentary = data.slice(0, 50);
      }
    } catch (error) {
      console.error('Error fetching commentary:', error);
    }

    // Convert ESPN data to MatchData format
    const matchData = espnToMatchData(espnData.header, commentary);

    return NextResponse.json(
      {
        match: matchData,
        commentary: commentary,
        lastUpdate: new Date().toISOString()
      },
      {
        headers: {
          // Cache for 15 seconds, allow stale for 30 seconds
          'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30',
          'CDN-Cache-Control': 'public, s-maxage=15',
          'Vercel-CDN-Cache-Control': 'public, s-maxage=15'
        }
      }
    );
  } catch (error) {
    console.error('Error in match-live-update API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
