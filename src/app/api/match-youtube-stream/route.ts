import { NextRequest, NextResponse } from 'next/server';
import { getYouTubeStream, upsertYouTubeStream, deleteYouTubeStream } from '@/lib/mysql-match-db';

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

    const data = await getYouTubeStream(matchId);

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
    const youtube_url = `https://www.youtube.com/watch?v=${body.youtube_video_id}`;

    const success = await upsertYouTubeStream({
      match_id: body.match_id,
      competition: body.competition || 'CAN',
      youtube_url,
      video_id: body.youtube_video_id,
      stream_title: body.video_title || body.channel_name || null,
      is_live: body.is_live !== undefined ? body.is_live : true,
      viewer_count: body.viewer_count || 0,
    });

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to set YouTube stream' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'YouTube stream set successfully',
      data: {
        match_id: body.match_id,
        video_id: body.youtube_video_id,
      }
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

    const success = await deleteYouTubeStream(matchId);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete YouTube stream' },
        { status: 500 }
      );
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
