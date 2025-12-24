import { NextRequest, NextResponse } from 'next/server';
import { getPreMatchAnalysis, getMatchCommentary, getMatchReport } from '@/lib/mysql-match-db';

/**
 * GET /api/can2025/match-history
 * Retrieve complete historical data for a match (pre-match, live, post-match)
 *
 * Query params:
 * - match_id: ESPN match ID (required)
 * - locale: Language (fr, en, es) - default: fr
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const matchId = searchParams.get('match_id');
    const locale = searchParams.get('locale') || 'fr';

    if (!matchId) {
      return NextResponse.json(
        { error: 'match_id is required' },
        { status: 400 }
      );
    }

    // Fetch all historical data in parallel
    const [preMatch, commentary, report] = await Promise.all([
      getPreMatchAnalysis(matchId, locale),
      getMatchCommentary(matchId, locale),
      getMatchReport(matchId, locale),
    ]);

    return NextResponse.json({
      match_id: matchId,
      locale,
      pre_match: preMatch || null,
      live_commentary: commentary || [],
      post_match_report: report || null,
      has_pre_match: !!preMatch,
      has_live_commentary: (commentary?.length || 0) > 0,
      has_post_match_report: !!report,
      total_events: commentary?.length || 0,
    });

  } catch (error) {
    console.error('Error fetching match history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch match history' },
      { status: 500 }
    );
  }
}
