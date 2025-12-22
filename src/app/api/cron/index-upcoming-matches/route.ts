import { NextResponse } from 'next/server';
import { getGoogleIndexingAPI } from '@/lib/google-indexing';

/**
 * Cron Job: Index Upcoming Matches
 *
 * Schedule: Every 6 hours (via vercel.json)
 *
 * Logic:
 * 1. Fetch all matches starting in next 24 hours
 * 2. Notify Google Indexing API for each match
 * 3. Rate limit to 200 requests/min (Google's limit)
 * 4. Return summary of indexing results
 *
 * Vercel Cron Configuration (add to vercel.json):
 * {
 *   "crons": [{
 *     "path": "/api/cron/index-upcoming-matches",
 *     "schedule": "0 *\/6 * * *"
 *   }]
 * }
 */

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes max

export async function GET(request: Request) {
  try {
    // Verify this is a legitimate cron request (Vercel cron secret)
    const authHeader = request.headers.get('authorization');
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;

    if (process.env.NODE_ENV === 'production' && authHeader !== expectedAuth) {
      console.error('Unauthorized cron request');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('🕐 Cron job started: Index upcoming matches');

    // Fetch all CAN 2025 matches
    const response = await fetch(
      'https://site.api.espn.com/apis/site/v2/sports/soccer/caf.nations/scoreboard'
    );

    if (!response.ok) {
      throw new Error(`ESPN API error: ${response.status}`);
    }

    const data = await response.json();
    const matches = data.events || [];

    // Filter matches starting in next 24 hours
    const now = new Date();
    const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const upcomingMatches = matches.filter((match: any) => {
      const matchDate = new Date(match.date);
      return matchDate >= now && matchDate <= next24Hours;
    });

    console.log(`Found ${upcomingMatches.length} upcoming matches in next 24 hours`);

    if (upcomingMatches.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No upcoming matches in next 24 hours',
        timestamp: new Date().toISOString()
      });
    }

    // Get Google Indexing API instance
    const indexingAPI = getGoogleIndexingAPI();

    // Extract match IDs
    const matchIds = upcomingMatches.map((match: any) => match.id);

    // Batch notify with rate limiting (300ms delay = ~200 req/min)
    const successCount = await indexingAPI.notifyBatch(matchIds, 300);

    console.log(`✅ Cron job completed: ${successCount}/${matchIds.length} matches indexed`);

    return NextResponse.json({
      success: true,
      totalMatches: upcomingMatches.length,
      indexedMatches: successCount,
      failedMatches: matchIds.length - successCount,
      matches: upcomingMatches.map((match: any) => ({
        id: match.id,
        name: match.name,
        date: match.date
      })),
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('❌ Cron job error:', error);
    return NextResponse.json(
      {
        error: 'Cron job failed',
        message: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
