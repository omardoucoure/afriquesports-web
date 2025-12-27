import { NextRequest, NextResponse } from 'next/server';
import { getAllCommentedMatches } from '@/lib/mysql-match-db';

export async function GET(request: NextRequest) {
  try {
    console.log('[API] /api/matches/commented - Starting request');

    // Get all matches with commentary or pre-match from MySQL
    const commentedMatches = await getAllCommentedMatches();

    console.log(`[API] getAllCommentedMatches returned ${commentedMatches.length} matches`);

    if (commentedMatches.length === 0) {
      console.log('[API] No matches found, returning empty response');
      return NextResponse.json({
        success: true,
        count: 0,
        matches: [],
        debug: 'No commented matches found in database'
      });
    }

    // Use match data directly from MySQL (no ESPN API needed)
    const matchDetails = commentedMatches.map((match) => {
      return {
        match_id: match.match_id,
        home_team: match.home_team || 'TBD',
        away_team: match.away_team || 'TBD',
        home_score: '-',
        away_score: '-',
        status: 'Scheduled',
        date: match.first_commented,
        competition: match.competition || 'African Cup of Nations',
        has_commentary: match.has_commentary,
        has_prematch: match.has_prematch,
        commentary_count: match.commentary_count,
        first_commented: match.first_commented
      };
    }).sort((a, b) => {
      // Sort by date, most recent first
      const dateA = new Date(a.first_commented || 0).getTime();
      const dateB = new Date(b.first_commented || 0).getTime();
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
