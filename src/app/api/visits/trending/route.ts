import { NextRequest, NextResponse } from 'next/server';
import { getTrendingPostsByRange } from '@/lib/supabase-db';

export interface TrendingPost {
  post_id: string;
  post_slug: string;
  post_title: string;
  post_image: string | null;
  post_author: string | null;
  post_category: string | null;
  count: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const days = parseInt(searchParams.get('days') || '1', 10); // Default to today
    const locale = searchParams.get('locale') || 'fr'; // Default to French

    const trending = await getTrendingPostsByRange(days, limit, locale);

    return NextResponse.json({ trending });
  } catch (error) {
    console.error('Error fetching trending:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trending posts', trending: [] },
      { status: 500 }
    );
  }
}
