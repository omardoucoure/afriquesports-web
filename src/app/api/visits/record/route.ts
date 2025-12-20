import { NextRequest, NextResponse } from 'next/server';
import { recordVisit } from '@/lib/supabase-db';

// Force Node.js runtime for database operations
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { postId, postSlug, postTitle, postImage, postAuthor, postCategory, postSource } = body;

    if (!postId || !postSlug || !postTitle) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await recordVisit({
      postId,
      postSlug,
      postTitle,
      postImage,
      postAuthor,
      postCategory,
      postSource,
    });

    if (!result) {
      console.error('[API /api/visits/record] Database connection failed - result is null');
      return NextResponse.json({ success: false, error: 'Database unavailable' }, { status: 503 });
    }

    console.log('[API /api/visits/record] Visit recorded successfully:', { postId, count: result.count });
    return NextResponse.json({ success: true, count: result.count });
  } catch (error) {
    console.error('[API /api/visits/record] Error recording visit:', error);
    return NextResponse.json(
      { error: 'Failed to record visit', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
