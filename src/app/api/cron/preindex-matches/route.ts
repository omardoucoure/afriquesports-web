/**
 * Pre-Match Indexing Cron Job
 *
 * Automatically submits match pages to Google Indexing API 2-3 hours before kickoff
 * This ensures pages are indexed and ranking before competitors
 *
 * Runs: Every 30 minutes
 */

import { NextResponse } from 'next/server';
import { GoogleIndexingAPI } from '@/lib/google-indexing';
import { createClient } from '@supabase/supabase-js';
import { generateMatchUrl } from '@/lib/match-url';
import mysql from 'mysql2/promise';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const SITE_URL = 'https://www.afriquesports.net';
const CRON_SECRET = process.env.CRON_SECRET;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface Match {
  id: number;
  home_team: string;
  away_team: string;
  match_datetime: Date;
  status: string;
}

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('🎯 Pre-Match Indexing: Starting...');

    // Connect to MySQL to get upcoming matches
    const connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
    });

    // Get matches starting in next 2-4 hours
    const now = new Date();
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const fourHoursFromNow = new Date(now.getTime() + 4 * 60 * 60 * 1000);

    const [rows] = await connection.execute<any[]>(
      `SELECT id, home_team, away_team, match_datetime, status
       FROM can2025_matches
       WHERE match_datetime BETWEEN ? AND ?
       AND status IN ('scheduled', 'not_started')
       ORDER BY match_datetime ASC`,
      [twoHoursFromNow, fourHoursFromNow]
    );

    await connection.end();

    const upcomingMatches = rows as Match[];
    console.log(`📋 Found ${upcomingMatches.length} matches starting in 2-4 hours`);

    if (upcomingMatches.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No upcoming matches in the next 2-4 hours',
        matchesProcessed: 0
      });
    }

    // Check which matches have already been submitted
    const { data: alreadySubmitted } = await supabase
      .from('seo_indexing_status')
      .select('url')
      .like('url', '%/can-2025/match/%');

    const submittedUrls = new Set(
      alreadySubmitted?.map(record => record.url) || []
    );

    const indexingAPI = new GoogleIndexingAPI();
    const results = {
      submitted: [] as string[],
      skipped: [] as string[],
      errors: [] as string[],
    };

    // Process each match
    for (const match of upcomingMatches) {
      // Generate SEO-friendly URL with team names
      const matchUrl = generateMatchUrl(match.home_team, match.away_team, match.id, 'fr');
      const matchTime = new Date(match.match_datetime);
      const timeUntilMatch = Math.round((matchTime.getTime() - now.getTime()) / (60 * 1000));

      console.log(`\n⚽ Match: ${match.home_team} vs ${match.away_team}`);
      console.log(`   Kickoff in: ${timeUntilMatch} minutes`);
      console.log(`   URL: ${matchUrl}`);

      // Skip if already submitted
      if (submittedUrls.has(matchUrl)) {
        console.log(`   ⏭️  Already submitted - skipping`);
        results.skipped.push(matchUrl);
        continue;
      }

      try {
        // Step 1: Pre-warm the page (generate static version)
        console.log(`   🔥 Pre-warming page...`);
        const warmupResponse = await fetch(matchUrl, {
          method: 'GET',
          headers: { 'User-Agent': 'Googlebot' }
        });

        if (!warmupResponse.ok) {
          throw new Error(`Failed to warmup page: ${warmupResponse.status}`);
        }

        console.log(`   ✅ Page pre-warmed (${warmupResponse.status})`);

        // Step 2: Submit to Google Indexing API (all locales)
        console.log(`   📤 Submitting to Google Indexing API...`);

        const locales = ['fr', 'en', 'es'];
        const submissionResults = await Promise.allSettled(
          locales.map(locale => {
            const localizedUrl = generateMatchUrl(match.home_team, match.away_team, match.id, locale);
            return indexingAPI.notifyUpdate(localizedUrl);
          })
        );

        const successCount = submissionResults.filter(
          r => r.status === 'fulfilled' && r.value
        ).length;

        console.log(`   ✅ Submitted to Google (${successCount}/3 locales)`);

        // Step 3: Record in database
        await supabase.from('seo_indexing_status').upsert({
          url: matchUrl,
          submitted_at: new Date().toISOString(),
          indexing_status: 'submitted',
          last_checked_at: new Date().toISOString()
        }, { onConflict: 'url' });

        results.submitted.push(matchUrl);

        // Rate limiting: Wait 500ms between submissions
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error: any) {
        console.error(`   ❌ Error: ${error.message}`);
        results.errors.push(`${matchUrl}: ${error.message}`);
      }
    }

    console.log('\n📊 Summary:');
    console.log(`   ✅ Submitted: ${results.submitted.length}`);
    console.log(`   ⏭️  Skipped: ${results.skipped.length}`);
    console.log(`   ❌ Errors: ${results.errors.length}`);

    return NextResponse.json({
      success: true,
      matchesFound: upcomingMatches.length,
      submitted: results.submitted,
      skipped: results.skipped,
      errors: results.errors,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Pre-Match Indexing Error:', error);

    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, {
      status: 500
    });
  }
}
