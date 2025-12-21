import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// GET - Fetch pre-match analysis for a specific match
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const matchId = searchParams.get('match_id');
    const locale = searchParams.get('locale') || 'fr';

    if (!matchId) {
      return NextResponse.json(
        { error: 'match_id parameter is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('match_prematch_analysis')
      .select('*')
      .eq('match_id', matchId)
      .eq('locale', locale)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      throw error;
    }

    if (!data) {
      return NextResponse.json(
        {
          success: false,
          message: 'No pre-match analysis found for this match',
          matchId,
          locale
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      matchId,
      locale,
      analysis: {
        headToHead: data.head_to_head,
        recentForm: data.recent_form,
        keyPlayers: data.key_players,
        tacticalPreview: data.tactical_preview,
        prediction: data.prediction,
        homeFormation: data.home_formation || null,
        awayFormation: data.away_formation || null,
        generatedAt: data.created_at,
        updatedAt: data.updated_at,
      }
    });

  } catch (error) {
    console.error('Error fetching pre-match analysis:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Publish pre-match analysis (webhook from AI agent)
export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret
    const authHeader = request.headers.get('x-webhook-secret');
    const expectedSecret = process.env.AI_AGENT_WEBHOOK_SECRET;

    if (!expectedSecret || authHeader !== expectedSecret) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate required fields
    const requiredFields = ['match_id', 'locale'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // At least one analysis field must be provided
    if (!body.head_to_head && !body.recent_form && !body.key_players && !body.tactical_preview && !body.prediction && !body.home_formation && !body.away_formation) {
      return NextResponse.json(
        { error: 'At least one analysis field is required (head_to_head, recent_form, key_players, tactical_preview, prediction, home_formation, or away_formation)' },
        { status: 400 }
      );
    }

    // Upsert pre-match analysis (update if exists, insert if not)
    const { data, error } = await supabase
      .from('match_prematch_analysis')
      .upsert({
        match_id: body.match_id,
        locale: body.locale,
        head_to_head: body.head_to_head || null,
        recent_form: body.recent_form || null,
        key_players: body.key_players || null,
        tactical_preview: body.tactical_preview || null,
        prediction: body.prediction || null,
        home_formation: body.home_formation || null,
        away_formation: body.away_formation || null,
      }, {
        onConflict: 'match_id,locale',
        ignoreDuplicates: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    // Trigger ISR revalidation for the live match page
    revalidatePath('/match-en-direct');
    ['fr', 'en', 'es', 'ar'].forEach(loc => {
      revalidatePath(`/${loc}/match-en-direct`);
    });

    // Send webhook to trigger page revalidation
    const webhookUrl = process.env.NEXTJS_WEBHOOK_URL;
    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-webhook-secret': expectedSecret,
          },
          body: JSON.stringify({
            type: 'prematch_analysis',
            match_id: body.match_id,
            locale: body.locale,
            action: 'published',
          }),
        });
      } catch (webhookError) {
        console.error('Webhook notification failed:', webhookError);
        // Don't fail the request if webhook fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Pre-match analysis published successfully',
      data: {
        id: data.id,
        match_id: data.match_id,
        locale: data.locale,
        created_at: data.created_at,
        updated_at: data.updated_at,
      }
    });

  } catch (error: any) {
    console.error('Error publishing pre-match analysis:', error);

    // Handle unique constraint violations (duplicate)
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'Pre-match analysis already exists for this match and locale. Use PUT to update.' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
