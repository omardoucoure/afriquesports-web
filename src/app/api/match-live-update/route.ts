import { NextResponse } from 'next/server';
import { espnToMatchData } from '@/lib/match-schema';

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

    // Fetch latest commentary from Supabase
    let commentary = [];
    try {
      const commentaryResponse = await fetch(
        `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/can2025/live-commentary?match_id=${matchId}&locale=${locale}`,
        {
          next: { revalidate: 0 },
          cache: 'no-store'
        }
      );

      if (commentaryResponse.ok) {
        const commentaryData = await commentaryResponse.json();
        commentary = commentaryData.commentary || [];
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
