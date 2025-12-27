/**
 * SEO Agent Realtime Cron Endpoint
 *
 * Runs hourly during business hours (9am-9pm, configured in vercel.json)
 * Performs lightweight checks:
 * - Check for very recent articles (last 2 hours)
 * - Submit them for indexing immediately
 */

import { NextResponse } from 'next/server';
import { SEOAgentOrchestrator } from '@/lib/seo-agent/orchestrator';

const CRON_SECRET = process.env.CRON_SECRET;

export const maxDuration = 30; // 30 seconds timeout
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');

    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('⚡ SEO Agent Realtime: Starting hourly check...');

    const orchestrator = new SEOAgentOrchestrator();
    const result = await orchestrator.runRealtime();

    console.log(`✅ SEO Agent Realtime: Completed`);

    return NextResponse.json({
      success: result.status === 'success',
      articlesChecked: result.metrics.indexingMonitor?.articlesFound || 0,
      articlesSubmitted: result.metrics.indexingMonitor?.articlesSubmitted || 0,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ SEO Agent Realtime: Error:', error);

    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, {
      status: 500
    });
  }
}
