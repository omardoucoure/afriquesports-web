/**
 * SEO Agent Cron Endpoint
 *
 * Runs daily at 6am (configured via system cron or PM2)
 * Executes full SEO agent run:
 * - Fetch yesterday's GSC metrics
 * - Submit new articles for indexing
 * - Detect traffic drops
 * - Generate alerts
 */

import { NextResponse } from 'next/server';
import { SEOAgentOrchestrator } from '@/lib/seo-agent/orchestrator';

// Cron secret for authentication
const CRON_SECRET = process.env.CRON_SECRET;

export const maxDuration = 60; // 60 seconds timeout
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');

    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
      console.error('❌ Unauthorized cron request');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('🤖 SEO Agent Cron: Starting daily run...');

    const orchestrator = new SEOAgentOrchestrator();
    const result = await orchestrator.runFull();

    console.log(`✅ SEO Agent Cron: Completed with status ${result.status}`);

    return NextResponse.json({
      success: result.status === 'success',
      runType: result.runType,
      duration: (result.completedAt.getTime() - result.startedAt.getTime()) / 1000,
      metrics: result.metrics,
      errors: result.errors,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ SEO Agent Cron: Fatal error:', error);

    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, {
      status: 500
    });
  }
}
