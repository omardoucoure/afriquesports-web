import { NextRequest, NextResponse } from 'next/server';
import { recordVisit, initVisitsTable } from '@/lib/db';

// Initialize table on first request
let tableInitialized = false;

export async function POST(request: NextRequest) {
  try {
    // Initialize table if not done yet
    if (!tableInitialized) {
      await initVisitsTable();
      tableInitialized = true;
    }

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

    return NextResponse.json({ success: true, count: result.count });
  } catch (error) {
    console.error('Error recording visit:', error);
    return NextResponse.json(
      { error: 'Failed to record visit' },
      { status: 500 }
    );
  }
}
