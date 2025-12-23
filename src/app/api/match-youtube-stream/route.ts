import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// GET - Fetch YouTube stream for a match
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const matchId = searchParams.get('match_id');

    if (!matchId) {
      return NextResponse.json(
        { error: 'match_id parameter is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('match_youtube_streams')
      .select('*')
      .eq('match_id', matchId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      throw error;
    }

    return NextResponse.json({
      success: true,
      matchId,
      stream: data || null
    });

  } catch (error) {
    console.error('Error fetching YouTube stream:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Set YouTube stream for a match
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.match_id || !body.youtube_video_id) {
      return NextResponse.json(
        { error: 'match_id and youtube_video_id are required' },
        { status: 400 }
      );
    }

    // Upsert the stream
    const { data, error } = await supabase
      .from('match_youtube_streams')
      .upsert({
        match_id: body.match_id,
        youtube_video_id: body.youtube_video_id,
        channel_name: body.channel_name || null,
        video_title: body.video_title || null,
        is_live: body.is_live !== undefined ? body.is_live : true,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'match_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'YouTube stream set successfully',
      data
    });

  } catch (error: any) {
    console.error('Error setting YouTube stream:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Remove YouTube stream for a match
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const matchId = searchParams.get('match_id');

    if (!matchId) {
      return NextResponse.json(
        { error: 'match_id parameter is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('match_youtube_streams')
      .delete()
      .eq('match_id', matchId);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'YouTube stream removed successfully'
    });

  } catch (error) {
    console.error('Error deleting YouTube stream:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
