import { NextRequest, NextResponse } from 'next/server';

/**
 * PostHog Analytics Stats API
 * Fetches real-time analytics data from PostHog instead of WordPress
 *
 * Supports period filtering: day, week, month, all
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const period = searchParams.get('period') || 'week';

  // PostHog credentials
  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const posthogProjectId = process.env.POSTHOG_PROJECT_ID || '21827'; // Default project ID
  const posthogPersonalApiKey = process.env.POSTHOG_PERSONAL_API_KEY;

  if (!posthogPersonalApiKey) {
    return NextResponse.json(
      {
        error: 'PostHog Personal API Key not configured',
        instructions: 'Set POSTHOG_PERSONAL_API_KEY in environment variables'
      },
      { status: 503 }
    );
  }

  // Calculate date range
  let dateFrom: string;
  const dateTo = new Date().toISOString();

  switch (period) {
    case 'day':
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      dateFrom = yesterday.toISOString();
      break;
    case 'week':
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      dateFrom = weekAgo.toISOString();
      break;
    case 'month':
      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);
      dateFrom = monthAgo.toISOString();
      break;
    case 'all':
      const yearAgo = new Date();
      yearAgo.setFullYear(yearAgo.getFullYear() - 1);
      dateFrom = yearAgo.toISOString();
      break;
    default:
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() - 7);
      dateFrom = defaultDate.toISOString();
  }

  try {
    // Fetch page view events from PostHog
    const pageViewsResponse = await fetch(
      `https://us.i.posthog.com/api/projects/${posthogProjectId}/events?event=$pageview&after=${dateFrom}&before=${dateTo}`,
      {
        headers: {
          'Authorization': `Bearer ${posthogPersonalApiKey}`,
          'Content-Type': 'application/json',
        },
        next: { revalidate: 300 }, // Cache for 5 minutes
      }
    );

    if (!pageViewsResponse.ok) {
      throw new Error(`PostHog API error: ${pageViewsResponse.status} ${pageViewsResponse.statusText}`);
    }

    const pageViewsData = await pageViewsResponse.json();

    // Fetch article view events
    const articleViewsResponse = await fetch(
      `https://us.i.posthog.com/api/projects/${posthogProjectId}/events?event=Article_View_Page&after=${dateFrom}&before=${dateTo}`,
      {
        headers: {
          'Authorization': `Bearer ${posthogPersonalApiKey}`,
          'Content-Type': 'application/json',
        },
        next: { revalidate: 300 },
      }
    );

    const articleViewsData = articleViewsResponse.ok ? await articleViewsResponse.json() : { results: [] };

    // Process data to match WordPress stats structure
    const pageViewsByPath: Record<string, number> = {};
    const articlesByAuthor: Record<string, { posts: Set<string>; views: number }> = {};

    // Aggregate page views
    pageViewsData.results?.forEach((event: any) => {
      const path = event.properties?.$current_url || event.properties?.$pathname || 'unknown';
      pageViewsByPath[path] = (pageViewsByPath[path] || 0) + 1;
    });

    // Aggregate article views by author
    articleViewsData.results?.forEach((event: any) => {
      const author = event.properties?.article_author || event.properties?.author || 'Unknown';
      const articleId = event.properties?.article_id || event.properties?.article_slug || 'unknown';

      if (!articlesByAuthor[author]) {
        articlesByAuthor[author] = { posts: new Set(), views: 0 };
      }

      articlesByAuthor[author].posts.add(articleId);
      articlesByAuthor[author].views += 1;
    });

    // Format author stats
    const authorStats = Object.entries(articlesByAuthor)
      .map(([author, data]) => ({
        authorName: author,
        totalPosts: data.posts.size,
        totalViews: data.views,
        avgViewsPerPost: Math.round(data.views / data.posts.size) || 0,
      }))
      .sort((a, b) => b.totalPosts - a.totalPosts);

    // Calculate top pages
    const topPages = Object.entries(pageViewsByPath)
      .map(([path, views]) => ({ path, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    // Calculate summary stats
    const totalPageViews = Object.values(pageViewsByPath).reduce((sum, views) => sum + views, 0);
    const totalArticleViews = Object.values(articlesByAuthor).reduce((sum, data) => sum + data.views, 0);
    const uniqueVisitors = new Set(
      pageViewsData.results?.map((e: any) => e.properties?.distinct_id || e.distinct_id)
    ).size;

    return NextResponse.json(
      {
        period,
        dateFrom,
        dateTo,
        summary: {
          totalPageViews,
          totalArticleViews,
          uniqueVisitors,
          totalAuthors: authorStats.length,
        },
        authorStats,
        topPages,
        metadata: {
          source: 'PostHog',
          cacheMaxAge: 300,
        },
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=300, s-maxage=600',
        },
      }
    );
  } catch (error: any) {
    console.error('[API /api/posthog-stats] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch PostHog analytics',
        details: error.message,
        instructions: 'Ensure POSTHOG_PERSONAL_API_KEY and POSTHOG_PROJECT_ID are set',
      },
      { status: 500 }
    );
  }
}
