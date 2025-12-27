import { NextRequest, NextResponse } from 'next/server';
import { getAllCommentedMatches } from '@/lib/mysql-match-db';

export async function GET(request: NextRequest) {
  try {
    // Get all matches with commentary or pre-match from MySQL
    const commentedMatches = await getAllCommentedMatches();

    if (commentedMatches.length === 0) {
      return NextResponse.json({
        success: true,
        count: 0,
        matches: []
      });
    }

    // Fetch match details from ESPN API for each match
    const matchDetailsPromises = commentedMatches.map(async (match) => {
      try {
        const espnUrl = `https://site.api.espn.com/apis/site/v2/sports/soccer/afr.1/summary?event=${match.match_id}`;
        const response = await fetch(espnUrl);

        if (!response.ok) {
          console.error(`Failed to fetch ESPN data for match ${match.match_id}`);
          return null;
        }

        const data = await response.json();
        const header = data.header || {};
        const competitions = header.competitions || [];
        const competition = competitions[0] || {};
        const competitors = competition.competitors || [];

        const homeTeam = competitors.find((c: any) => c.homeAway === 'home');
        const awayTeam = competitors.find((c: any) => c.homeAway === 'away');

        return {
          match_id: match.match_id,
          home_team: homeTeam?.team?.displayName || 'Unknown',
          away_team: awayTeam?.team?.displayName || 'Unknown',
          home_score: homeTeam?.score || '0',
          away_score: awayTeam?.score || '0',
          status: data.header?.competitions?.[0]?.status?.type?.name || 'Unknown',
          date: data.header?.competitions?.[0]?.date || match.first_commented,
          competition: data.header?.league?.name || 'African Cup of Nations',
          has_commentary: match.has_commentary,
          has_prematch: match.has_prematch,
          commentary_count: match.commentary_count,
          first_commented: match.first_commented
        };
      } catch (error) {
        console.error(`Error fetching details for match ${match.match_id}:`, error);
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
