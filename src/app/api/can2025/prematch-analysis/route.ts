import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getPreMatchAnalysis, upsertPreMatchAnalysis } from '@/lib/mysql-match-db';

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

    const data = await getPreMatchAnalysis(matchId, locale);

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
        homeFormation: data.home_formation,
        awayFormation: data.away_formation,
        homeLineup: data.home_lineup,
        awayLineup: data.away_lineup,
        homeSubstitutes: data.home_substitutes,
        awaySubstitutes: data.away_substitutes,
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
    if (!body.head_to_head && !body.recent_form && !body.key_players && !body.tactical_preview && !body.prediction && !body.home_formation && !body.away_formation && !body.home_lineup && !body.away_lineup) {
      return NextResponse.json(
        { error: 'At least one analysis field is required (head_to_head, recent_form, key_players, tactical_preview, prediction, formations, or lineups)' },
        { status: 400 }
      );
    }

    // Upsert pre-match analysis (update if exists, insert if not)
    const success = await upsertPreMatchAnalysis({
      match_id: body.match_id,
      locale: body.locale,
      home_team: body.home_team || '',
      away_team: body.away_team || '',
      competition: body.competition || 'CAN',
      head_to_head: body.head_to_head,
      recent_form: body.recent_form,
      key_players: body.key_players,
      tactical_preview: body.tactical_preview,
      prediction: body.prediction,
      home_formation: body.home_formation,
      away_formation: body.away_formation,
      home_lineup: body.home_lineup,
      away_lineup: body.away_lineup,
      home_substitutes: body.home_substitutes,
      away_substitutes: body.away_substitutes,
      confidence_score: body.confidence_score,
    });

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to save pre-match analysis' },
        { status: 500 }
      );
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
        match_id: body.match_id,
        locale: body.locale,
      }
    });

  } catch (error: any) {
    console.error('Error publishing pre-match analysis:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
