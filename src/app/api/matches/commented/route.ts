import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Get all unique match IDs from match_commentary_ai
    const { data: commentaryMatches, error: commentaryError } = await supabase
      .from('match_commentary_ai')
      .select('match_id, created_at')
      .order('created_at', { ascending: false });

    if (commentaryError) {
      console.error('Error fetching commentary matches:', commentaryError);
      return NextResponse.json(
        { error: 'Failed to fetch matches', message: commentaryError.message },
        { status: 500 }
      );
    }

    // Get all unique match IDs from match_prematch_analysis
    const { data: prematchMatches, error: prematchError } = await supabase
      .from('match_prematch_analysis')
      .select('match_id, created_at')
      .order('created_at', { ascending: false });

    if (prematchError) {
      console.error('Error fetching prematch matches:', prematchError);
      return NextResponse.json(
        { error: 'Failed to fetch matches', message: prematchError.message },
        { status: 500 }
      );
    }

    // Combine and deduplicate match IDs
    const allMatchIds = new Set<string>();
    const matchDates = new Map<string, string>();

    commentaryMatches?.forEach(m => {
      allMatchIds.add(m.match_id);
      if (!matchDates.has(m.match_id)) {
        matchDates.set(m.match_id, m.created_at);
      }
    });

    prematchMatches?.forEach(m => {
      allMatchIds.add(m.match_id);
      if (!matchDates.has(m.match_id)) {
        matchDates.set(m.match_id, m.created_at);
      }
    });

    // Fetch match details from ESPN API for each match
    const matchDetailsPromises = Array.from(allMatchIds).map(async (matchId) => {
      try {
        const espnUrl = `https://site.api.espn.com/apis/site/v2/sports/soccer/afr.1/summary?event=${matchId}`;
        const response = await fetch(espnUrl);

        if (!response.ok) {
          console.error(`Failed to fetch ESPN data for match ${matchId}`);
          return null;
        }

        const data = await response.json();
        const header = data.header || {};
        const competitions = header.competitions || [];
        const competition = competitions[0] || {};
        const competitors = competition.competitors || [];

        const homeTeam = competitors.find((c: any) => c.homeAway === 'home');
        const awayTeam = competitors.find((c: any) => c.homeAway === 'away');

        // Get commentary counts
        const { count: commentaryCount } = await supabase
          .from('match_commentary_ai')
          .select('*', { count: 'exact', head: true })
          .eq('match_id', matchId);

        const { count: prematchCount } = await supabase
          .from('match_prematch_analysis')
          .select('*', { count: 'exact', head: true })
          .eq('match_id', matchId);

        return {
          match_id: matchId,
          home_team: homeTeam?.team?.displayName || 'Unknown',
          away_team: awayTeam?.team?.displayName || 'Unknown',
          home_score: homeTeam?.score || '0',
          away_score: awayTeam?.score || '0',
          status: data.header?.competitions?.[0]?.status?.type?.name || 'Unknown',
          date: data.header?.competitions?.[0]?.date || matchDates.get(matchId),
          competition: data.header?.league?.name || 'African Cup of Nations',
          has_commentary: (commentaryCount || 0) > 0,
          has_prematch: (prematchCount || 0) > 0,
          commentary_count: commentaryCount || 0,
          first_commented: matchDates.get(matchId)
        };
      } catch (error) {
        console.error(`Error fetching details for match ${matchId}:`, error);
        return null;
      }
    });

    const matchDetails = (await Promise.all(matchDetailsPromises))
      .filter(m => m !== null)
      .sort((a, b) => {
        // Sort by date, most recent first
        const dateA = new Date(a!.first_commented || 0).getTime();
        const dateB = new Date(b!.first_commented || 0).getTime();
        return dateB - dateA;
      });

    return NextResponse.json({
      success: true,
      count: matchDetails.length,
      matches: matchDetails
    });
  } catch (error: any) {
    console.error('Error in commented matches API:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
