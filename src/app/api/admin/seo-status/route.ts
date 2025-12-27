/**
 * SEO Agent Status API Endpoint
 *
 * Returns current SEO agent status, recent metrics, and alerts
 */

import { NextResponse } from 'next/server';
import { SEOAgentOrchestrator } from '@/lib/seo-agent/orchestrator';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Verify admin token
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

    if (!token || token !== ADMIN_TOKEN) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orchestrator = new SEOAgentOrchestrator();
    const status = await orchestrator.getStatus();

    return NextResponse.json({
      success: true,
      ...status,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Error getting SEO status:', error);

    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, {
      status: 500
    });
  }
}
