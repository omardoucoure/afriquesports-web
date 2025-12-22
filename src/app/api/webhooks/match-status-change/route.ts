import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getGoogleIndexingAPI } from '@/lib/google-indexing';

/**
 * Webhook endpoint for match status changes
 *
 * Triggers when:
 * - Match goes live (EventScheduled → Live)
 * - Match finishes (Live → EventCompleted)
 * - Score updates during live matches
 *
 * Actions:
 * 1. Notify Google Indexing API for instant crawling
 * 2. Revalidate match page to regenerate with latest data
 * 3. Return success response
 *
 * Usage:
 * POST /api/webhooks/match-status-change
 * Body: {
 *   matchId: string,
 *   status: 'live' | 'completed' | 'updated',
 *   secret: string
 * }
 */

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { matchId, status, secret } = body;

    // Validate webhook secret
    const expectedSecret = process.env.WEBHOOK_SECRET || 'default-secret-change-in-production';
    if (secret !== expectedSecret) {
      console.error('Invalid webhook secret');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Validate required fields
    if (!matchId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: matchId, status' },
        { status: 400 }
      );
    }

    console.log(`🔔 Webhook received: Match ${matchId} status changed to ${status}`);

    // Get Google Indexing API instance
    const indexingAPI = getGoogleIndexingAPI();

    // Notify Google Indexing API for all locales
    const indexingSuccess = await indexingAPI.notifyMatchAllLocales(matchId);

    // Revalidate match pages for all locales
    const locales = ['fr', 'en', 'es', 'ar'];
    for (const locale of locales) {
      try {
        revalidatePath(`/${locale}/can-2025/match/${matchId}`);
        console.log(`✅ Revalidated: /${locale}/can-2025/match/${matchId}`);
      } catch (error) {
        console.error(`Error revalidating ${locale}:`, error);
      }
    }

    // Return success response
    return NextResponse.json({
      success: true,
      matchId,
      status,
      indexingNotified: indexingSuccess,
      revalidated: true,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Error in match-status-change webhook:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error.message
      },
      { status: 500 }
    );
  }
}

/**
 * Health check endpoint
 */
export async function GET(request: Request) {
  return NextResponse.json({
    status: 'ok',
    endpoint: 'match-status-change',
    message: 'Webhook endpoint is ready'
  });
}
