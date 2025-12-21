import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Supabase client
function getSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials');
  }

  return createClient(supabaseUrl, supabaseKey);
}

/**
 * GET /api/can2025/match-report
 *
 * Fetch AI-generated match report (published within 5 min of final whistle)
 *
 * Query params:
 * - match_id: ESPN match ID (required)
 * - locale: Language (fr, en, es, ar) - default: fr
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const matchId = searchParams.get('match_id');
  const locale = searchParams.get('locale') || 'fr';

  // Validate required params
  if (!matchId) {
    return NextResponse.json(
      { error: 'match_id parameter is required' },
      { status: 400 }
    );
  }

  try {
    const supabase = getSupabaseClient();

    // Fetch report from Supabase
    const { data, error } = await supabase
      .from('match_reports_ai')
      .select('*')
      .eq('match_id', matchId)
      .eq('locale', locale)
      .single();

    if (error) {
      // No report found
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          success: true,
          matchId,
          locale,
          report: null,
          message: 'Report not yet available'
        }, {
          headers: {
            // Cache "no report" for 2 minutes (report might be generated soon)
            'Cache-Control': 's-maxage=120, stale-while-revalidate=60'
          }
        });
      }

      console.error('[Match Report API] Supabase error:', error);
      return NextResponse.json(
        { error: 'Database query failed', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      matchId,
      locale,
      report: data,
      timestamp: new Date().toISOString()
    }, {
      headers: {
        // Cache for 1 hour (reports don't change once published)
        'Cache-Control': 's-maxage=3600, stale-while-revalidate=1800'
      }
    });

  } catch (error: any) {
    console.error('[Match Report API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/can2025/match-report
 *
 * Publish new match report (called by AI agent within 5 min of final whistle)
 *
 * Body:
 * {
 *   "match_id": "401638475",
 *   "locale": "fr",
 *   "title": "Morocco dominate Comoros 3-0",
 *   "summary": "Morocco cruise to opening victory...",
 *   "key_moments": [
 *     {"minute": "23'", "event": "Goal - Hakimi", "description": "..."},
 *     {"minute": "45'+2", "event": "Yellow card - Boudrika", "description": "..."}
 *   ],
 *   "player_ratings": [
 *     {"name": "Achraf Hakimi", "rating": 9.0, "review": "Exceptional performance"},
 *     {"name": "Youssef En-Nesyri", "rating": 7.5, "review": "Solid display"}
 *   ],
 *   "statistics": {
 *     "possession": {"home": 65, "away": 35},
 *     "shots": {"home": 18, "away": 4},
 *     "shots_on_target": {"home": 8, "away": 1}
 *   },
 *   "analysis": "Morocco's tactical masterclass..."
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret
    const authHeader = request.headers.get('x-webhook-secret');
    const expectedSecret = process.env.AI_AGENT_WEBHOOK_SECRET;

    if (!expectedSecret) {
      console.error('[Match Report API] AI_AGENT_WEBHOOK_SECRET not configured');
      return NextResponse.json(
        { error: 'Webhook not configured' },
        { status: 500 }
      );
    }

    if (authHeader !== expectedSecret) {
      console.error('[Match Report API] Unauthorized webhook attempt');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate required fields
    const required = ['match_id', 'locale', 'title', 'summary'];
    for (const field of required) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    const supabase = getSupabaseClient();

    // Insert or update report (upsert on unique constraint)
    const { data, error } = await supabase
      .from('match_reports_ai')
      .upsert({
        match_id: body.match_id,
        locale: body.locale,
        title: body.title,
        summary: body.summary,
        key_moments: body.key_moments || null,
        player_ratings: body.player_ratings || null,
        statistics: body.statistics || null,
        analysis: body.analysis || null,
        published_to_wp: body.published_to_wp || false,
        wp_post_id: body.wp_post_id || null
      }, {
        onConflict: 'match_id,locale'
      })
      .select()
      .single();

    if (error) {
      console.error('[Match Report API] Insert error:', error);
      return NextResponse.json(
        { error: 'Failed to publish report', details: error.message },
        { status: 500 }
      );
    }

    console.log('[Match Report API] ✅ Report published:', {
      match: body.match_id,
      locale: body.locale,
      title: body.title
    });

    return NextResponse.json({
      success: true,
      data,
      message: 'Match report published successfully'
    });

  } catch (error: any) {
    console.error('[Match Report API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
