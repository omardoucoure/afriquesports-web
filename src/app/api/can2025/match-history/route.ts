import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
    const [preMatchRes, commentaryRes, reportRes] = await Promise.all([
      // Pre-match analysis
      supabase
        .from('match_prematch_analysis')
        .select('*')
        .eq('match_id', matchId)
        .eq('locale', locale)
        .single(),

      // Live commentary (all events)
      supabase
        .from('match_commentary_ai')
        .select('*')
        .eq('match_id', matchId)
        .eq('locale', locale)
        .order('time_seconds', { ascending: false }),

      // Post-match report
      supabase
        .from('match_reports_ai')
        .select('*')
        .eq('match_id', matchId)
        .eq('locale', locale)
        .single(),
    ]);

    return NextResponse.json({
      match_id: matchId,
      locale,
      pre_match: preMatchRes.data || null,
      live_commentary: commentaryRes.data || [],
      post_match_report: reportRes.data || null,
      has_pre_match: !!preMatchRes.data,
      has_live_commentary: (commentaryRes.data?.length || 0) > 0,
      has_post_match_report: !!reportRes.data,
      total_events: commentaryRes.data?.length || 0,
    });

  } catch (error) {
    console.error('Error fetching match history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch match history' },
      { status: 500 }
    );
  }
}
