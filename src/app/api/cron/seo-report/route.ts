/**
 * SEO Weekly Report Cron Endpoint
 *
 * Runs every Monday at 8am (configured via system cron or PM2)
 * Sends comprehensive weekly SEO report email
 */

import { NextResponse } from 'next/server';
import { ReportGenerator } from '@/lib/seo-agent/report-generator';

const CRON_SECRET = process.env.CRON_SECRET;

export const maxDuration = 60; // 60 seconds timeout
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

    console.log('📊 SEO Weekly Report: Generating and sending...');

    const reportGenerator = new ReportGenerator();
    const success = await reportGenerator.sendWeeklyReport();

    console.log(`✅ SEO Weekly Report: ${success ? 'Sent successfully' : 'Failed'}`);

    return NextResponse.json({
      success,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ SEO Weekly Report: Error:', error);

    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, {
      status: 500
    });
  }
}
