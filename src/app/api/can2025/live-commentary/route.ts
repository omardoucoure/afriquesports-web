import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// POST - Publish live commentary (webhook from AI agent)
export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret
    const authHeader = request.headers.get('x-webhook-secret');
    const expectedSecret = process.env.AI_AGENT_WEBHOOK_SECRET;

    if (!expectedSecret) {
      console.error('[ERROR] AI_AGENT_WEBHOOK_SECRET environment variable is not set!');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    if (authHeader !== expectedSecret) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate required fields
    const requiredFields = ['match_id', 'event_id', 'time', 'time_seconds', 'locale', 'text', 'type'];
    for (const field of requiredFields) {
      if (!body[field] && body[field] !== 0) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Insert live commentary event
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
        confidence: body.confidence || 0.9,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Duplicate event_id. Commentary already exists.' },
          { status: 409 }
        );
      }

      console.error('Supabase error:', error);
      throw error;
    }

    // Trigger revalidation
    revalidatePath('/match-en-direct');
    ['fr', 'en', 'es', 'ar'].forEach(loc => {
      revalidatePath(`/${loc}/match-en-direct`);
    });

    return NextResponse.json({
      success: true,
      message: 'Commentary published successfully',
      data: {
        id: data.id,
        match_id: data.match_id,
        event_id: data.event_id,
        created_at: data.created_at,
      }
    });

  } catch (error: any) {
    console.error('Error publishing live commentary:', error);

    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// GET - Fetch live commentary
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const matchId = searchParams.get('match_id');
    const locale = searchParams.get('locale') || 'fr';
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!matchId) {
      return NextResponse.json(
        { error: 'match_id parameter is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('match_commentary_ai')
      .select('*')
      .eq('match_id', matchId)
      .eq('locale', locale)
      .order('time_seconds', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      matchId,
      locale,
      commentary: data || []
    });

  } catch (error) {
    console.error('Error fetching live commentary:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
