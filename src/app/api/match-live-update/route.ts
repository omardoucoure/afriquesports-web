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

    // Extract ESPN commentary and transform to match page format
    let commentary: any[] = [];

    if (espnData.commentary && espnData.commentary.length > 0) {
      // Transform ESPN commentary to match expected format
      // Reverse to show newest events first, then limit to 100 most recent
      commentary = espnData.commentary.reverse().slice(0, 100).map((item: any, index: number) => {
        const time = item.time?.displayValue || '';
        const text = item.text || '';

        // Determine event type based on text content
        const textLower = text.toLowerCase();
        const isGoal = (textLower.includes('goal!') ||
                        (textLower.includes('scores') && !textLower.includes('saved')) ||
                        (textLower.startsWith('goal ') && !textLower.includes('attempt'))) &&
                       !textLower.includes('missed') &&
                       !textLower.includes('saved');
        const isYellowCard = textLower.includes('yellow card');
        const isRedCard = textLower.includes('red card');
        const isSubstitution = textLower.includes('substitution');
        const isPenalty = textLower.includes('penalty');
        const isVAR = textLower.includes('var') || textLower.includes('video assistant');

        // Determine icon based on event type
        let icon = '⚽';
        let type = 'general';

        if (isGoal) {
          icon = '⚽';
          type = 'goal';
        } else if (isPenalty && text.toLowerCase().includes('missed')) {
          icon = '❌';
          type = 'penaltyMissed';
        } else if (isPenalty) {
          icon = '🎯';
          type = 'penaltyAwarded';
        } else if (isRedCard) {
          icon = '🟥';
          type = 'redCard';
        } else if (isYellowCard) {
          icon = '🟨';
          type = 'yellowCard';
        } else if (isSubstitution) {
          icon = '🔄';
          type = 'substitution';
        } else if (isVAR) {
          icon = '📺';
          type = 'varCheck';
        } else if (text.toLowerCase().includes('corner')) {
          icon = '⚐';
          type = 'corner';
        } else if (text.toLowerCase().includes('foul')) {
          icon = '🚫';
          type = 'foul';
        } else {
          icon = '▶';
          type = 'general';
        }

        return {
          id: `espn-${matchId}-${index}`,
          time: time,
          type: type,
          text: text,
          is_scoring: isGoal,
          icon: icon,
          team: null, // ESPN doesn't provide this in commentary
          player_name: null // Would need to parse from text
        };
      });
    } else {
      // Fallback: Try to fetch commentary from MySQL if ESPN has none
      try {
        const data = await getMatchCommentary(matchId, locale);
        if (data) {
          commentary = data.slice(0, 100);
        }
      } catch (error) {
        console.error('Error fetching MySQL commentary:', error);
      }
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
