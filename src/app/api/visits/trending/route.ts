import { NextRequest, NextResponse } from 'next/server';
import { getTrendingPosts, getTrendingPostsByRange, initVisitsTable } from '@/lib/db';

export interface TrendingPost {
  post_id: string;
  post_slug: string;
  post_title: string;
  post_image: string | null;
  post_author: string | null;
  post_category: string | null;
  count: number;
}

// Initialize table on first request
let tableInitialized = false;

export async function GET(request: NextRequest) {
  try {
    // Initialize table if not done yet
    if (!tableInitialized) {
      await initVisitsTable();
      tableInitialized = true;
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const days = searchParams.get('days'); // Optional: get trending over X days

    let trending;
    if (days) {
      trending = await getTrendingPostsByRange(parseInt(days, 10), limit);
    } else {
      trending = await getTrendingPosts(limit);
    }

    return NextResponse.json({ trending });
  } catch (error) {
    console.error('Error fetching trending:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trending posts', trending: [] },
      { status: 500 }
    );
  }
}
