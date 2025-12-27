import { NextRequest, NextResponse } from 'next/server';
import { insertMatchCommentary, getMatchCommentary } from '@/lib/mysql-match-db';

// GET - Fetch commentary for a specific match
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

    const commentary = await getMatchCommentary(matchId, locale);

    return NextResponse.json({
      success: true,
      matchId,
      locale,
      count: commentary.length,
      commentary
    });

  } catch (error) {
    console.error('Error fetching commentary:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Add commentary (webhook from AI agent)
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
    if (!body.match_id || !body.locale || !body.commentary) {
      return NextResponse.json(
        { error: 'Missing required fields: match_id, locale, commentary' },
        { status: 400 }
      );
    }

    const commentaryItem = body.commentary;

    // Insert commentary
    const success = await insertMatchCommentary({
      match_id: body.match_id,
      event_id: commentaryItem.event_id,
      competition: commentaryItem.competition || 'CAN',
      time: commentaryItem.time,
      time_seconds: commentaryItem.time_seconds,
      locale: body.locale,
      text: commentaryItem.text,
      type: commentaryItem.type || 'commentary',
      team: commentaryItem.team,
      player_name: commentaryItem.player_name,
      player_image: commentaryItem.player_image,
      icon: commentaryItem.icon,
      is_scoring: commentaryItem.is_scoring || false,
      confidence: commentaryItem.confidence || 1.0
    });

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to save commentary' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Commentary added successfully',
      data: {
        match_id: body.match_id,
        event_id: commentaryItem.event_id
      }
    });

  } catch (error: any) {
    console.error('Error adding commentary:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
