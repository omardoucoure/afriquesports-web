/**
 * AI Article Regeneration Cron Endpoint
 *
 * Regenerates placeholder articles using AI
 * Run via cron job or manual trigger
 *
 * Usage:
 * curl -X POST https://afriquesports.net/api/cron/regenerate-articles \
 *   -H "Authorization: Bearer CRON_SECRET" \
 *   -H "Content-Type: application/json" \
 *   -d '{"batchSize": 10}'
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  batchRegenerate,
  getRegenerationStats,
  getPlaceholderCount,
} from '@/lib/ai-article-regenerator';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes max

export async function POST(request: NextRequest) {
  // Verify authorization
  const authHeader = request.headers.get('authorization');
  const expectedToken = `Bearer ${process.env.CRON_SECRET}`;

  if (authHeader !== expectedToken) {
    console.error('[Regenerate] Unauthorized request');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const batchSize = Math.min(body.batchSize || 10, 50); // Max 50 per request
    const delayMs = body.delayMs || 2000; // 2s between articles

    console.log(`[Regenerate] Starting batch of ${batchSize} articles...`);

    const result = await batchRegenerate(batchSize, delayMs);

    const stats = await getRegenerationStats();

    return NextResponse.json({
      success: true,
      batch: result,
      stats: {
        remaining: stats.totalPlaceholder,
        total: stats.totalPublished,
        recentlyGenerated: stats.recentlyGenerated,
      },
      message: `Generated ${result.success}/${result.total} articles. ${stats.totalPlaceholder} remaining.`
    });

  } catch (error: any) {
    console.error('[Regenerate] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Allow GET for stats only (no auth required)
  try {
    const stats = await getRegenerationStats();
    const placeholderCount = await getPlaceholderCount();

    return NextResponse.json({
      placeholder_articles: placeholderCount,
      total_published: stats.totalPublished,
      recently_generated_24h: stats.recentlyGenerated,
      progress_percent: stats.totalPublished > 0
        ? ((stats.totalPublished - placeholderCount) / stats.totalPublished * 100).toFixed(2)
        : 0,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
