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
 * GET /api/can2025/live-commentary
 *
 * Fetch live AI-generated commentary for a match
 *
 * Query params:
 * - match_id: ESPN match ID (required)
 * - locale: Language (fr, en, es, ar) - default: fr
 * - limit: Number of events to return - default: 50
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const matchId = searchParams.get('match_id');
  const locale = searchParams.get('locale') || 'fr';
  const limit = parseInt(searchParams.get('limit') || '50');

  // Validate required params
  if (!matchId) {
    return NextResponse.json(
      { error: 'match_id parameter is required' },
      { status: 400 }
    );
  }

  try {
    const supabase = getSupabaseClient();

    // Fetch commentary from Supabase
    const { data, error } = await supabase
      .from('match_commentary_ai')
      .select('*')
      .eq('match_id', matchId)
      .eq('locale', locale)
      .order('time_seconds', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('[Live Commentary API] Supabase error:', error);
      return NextResponse.json(
        { error: 'Database query failed', details: error.message },
        { status: 500 }
      );
    }

    // Check if match is currently live (has commentary in last 5 minutes)
    const isLive = data && data.length > 0 &&
      new Date(data[0].created_at).getTime() > Date.now() - 5 * 60 * 1000;

    return NextResponse.json({
      success: true,
      matchId,
      locale,
      isLive,
      commentary: data || [],
      count: data?.length || 0,
      timestamp: new Date().toISOString()
    }, {
      headers: {
        // Cache for 10 seconds during live matches, 5 minutes otherwise
        'Cache-Control': isLive ? 's-maxage=10, stale-while-revalidate=5' : 's-maxage=300'
      }
    });

  } catch (error: any) {
    console.error('[Live Commentary API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/can2025/live-commentary
 *
 * Add new commentary event (called by AI agent via webhook)
 *
 * Body:
 * {
 *   "match_id": "string",
 *   "event_id": "string",
 *   "time": "67'",
 *   "time_seconds": 4020,
 *   "locale": "fr",
 *   "text": "But! Achraf Hakimi...",
 *   "type": "goal",
 *   "team": "Morocco",
 *   "player_name": "Achraf Hakimi",
 *   "icon": "⚽",
 *   "is_scoring": true
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret
    const authHeader = request.headers.get('x-webhook-secret');
    const expectedSecret = process.env.AI_AGENT_WEBHOOK_SECRET;

    if (!expectedSecret) {
      console.error('[Live Commentary API] AI_AGENT_WEBHOOK_SECRET not configured');
      return NextResponse.json(
        { error: 'Webhook not configured' },
        { status: 500 }
      );
    }

    if (authHeader !== expectedSecret) {
      console.error('[Live Commentary API] Unauthorized webhook attempt');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate required fields
    const required = ['match_id', 'event_id', 'time', 'time_seconds', 'locale', 'text', 'type'];
    for (const field of required) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    const supabase = getSupabaseClient();

    // Insert commentary
    const { data, error } = await supabase
      .from('match_commentary_ai')
      .insert({
        match_id: body.match_id,
        event_id: body.event_id,
        time: body.time,
        time_seconds: body.time_seconds,
        locale: body.locale,
        text: body.text,
        type: body.type,
        team: body.team || null,
        player_name: body.player_name || null,
        player_image: body.player_image || null,
        icon: body.icon || '⚽',
        is_scoring: body.is_scoring || false,
        confidence: body.confidence || 1.0
      })
      .select()
      .single();

    if (error) {
      // Check for unique constraint violation (duplicate event)
      if (error.code === '23505') {
        console.log('[Live Commentary API] Duplicate event ignored:', body.event_id);
        return NextResponse.json({
          success: true,
          message: 'Event already exists',
          duplicate: true
        });
      }

      console.error('[Live Commentary API] Insert error:', error);
      return NextResponse.json(
        { error: 'Failed to insert commentary', details: error.message },
        { status: 500 }
      );
    }

    console.log('[Live Commentary API] ✅ Commentary added:', {
      match: body.match_id,
      event: body.event_id,
      type: body.type,
      locale: body.locale
    });

    return NextResponse.json({
      success: true,
      data,
      message: 'Commentary published successfully'
    });

  } catch (error: any) {
    console.error('[Live Commentary API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
