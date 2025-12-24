import { NextRequest, NextResponse } from 'next/server';
import { getMatchReport, upsertMatchReport } from '@/lib/mysql-match-db';

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
    // Fetch report from MySQL
    const data = await getMatchReport(matchId, locale);

    if (!data) {
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

    // Insert or update report (upsert on unique constraint)
    const success = await upsertMatchReport({
      match_id: body.match_id,
      locale: body.locale,
      competition: body.competition || 'CAN',
      title: body.title,
      summary: body.summary,
      key_moments: body.key_moments,
      player_ratings: body.player_ratings,
      statistics: body.statistics,
      analysis: body.analysis,
      published_to_wp: body.published_to_wp || false,
      wp_post_id: body.wp_post_id,
    });

    if (!success) {
      console.error('[Match Report API] Insert error');
      return NextResponse.json(
        { error: 'Failed to publish report' },
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
      data: {
        match_id: body.match_id,
        locale: body.locale,
      },
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
