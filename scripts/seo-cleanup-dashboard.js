#!/usr/bin/env node
/**
 * SEO Cleanup Weekly Monitoring Dashboard
 *
 * Tracks progress of duplicate URL deindexing and ensures zero traffic loss.
 * Run weekly to monitor SEO consolidation from 511k → 155k indexed URLs.
 *
 * Usage: node scripts/seo-cleanup-dashboard.js
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const SITE_URL = 'sc-domain:afriquesports.net';
const CREDENTIALS_PATH = path.join(__dirname, '..', 'google-service-account.json');
const LOG_FILE = path.join(__dirname, '..', 'seo-cleanup-log.jsonl');
const BASELINE_CLICKS = 36000; // Minimum acceptable monthly traffic

async function generateWeeklyReport() {
  console.log('='.repeat(70));
  console.log('SEO CLEANUP WEEKLY MONITORING DASHBOARD');
  console.log('='.repeat(70));
  console.log('');

  const auth = new google.auth.GoogleAuth({
    keyFile: CREDENTIALS_PATH,
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
  });

  const webmasters = google.webmasters({ version: 'v3', auth });

  // Fetch last 7 days performance
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  console.log(`📅 Period: ${startDate} to ${endDate}`);
  console.log('');

  try {
    // Fetch search analytics data
    const perfData = await webmasters.searchanalytics.query({
      siteUrl: SITE_URL,
      requestBody: {
        startDate,
        endDate,
        dimensions: ['page'],
        rowLimit: 25000,
      }
    });

    if (!perfData.data.rows || perfData.data.rows.length === 0) {
      console.log('⚠️  No data available for this period');
      return;
    }

    // Calculate traffic metrics
    const totalClicks = perfData.data.rows.reduce((sum, row) => sum + row.clicks, 0);
    const totalImpressions = perfData.data.rows.reduce((sum, row) => sum + row.impressions, 0);
    const avgPosition = perfData.data.rows.reduce((sum, row) => sum + (row.position * row.impressions), 0) / totalImpressions;

    // Analyze duplicate vs clean URLs
    const duplicateUrls = perfData.data.rows.filter(row => row.keys[0].includes('?'));
    const cleanUrls = perfData.data.rows.filter(row => !row.keys[0].includes('?'));

    const duplicateClicks = duplicateUrls.reduce((sum, row) => sum + row.clicks, 0);
    const cleanClicks = cleanUrls.reduce((sum, row) => sum + row.clicks, 0);

    const duplicateImpressions = duplicateUrls.reduce((sum, row) => sum + row.impressions, 0);
    const cleanImpressions = cleanUrls.reduce((sum, row) => sum + row.impressions, 0);

    // Traffic analysis
    console.log('📊 TRAFFIC METRICS:');
    console.log(`  Total clicks: ${totalClicks.toLocaleString()}`);
    console.log(`  Total impressions: ${totalImpressions.toLocaleString()}`);
    console.log(`  Average position: ${avgPosition.toFixed(2)}`);
    console.log('');

    // URL distribution analysis
    console.log('🔗 URL DISTRIBUTION:');
    console.log(`  Total URLs with traffic: ${perfData.data.rows.length.toLocaleString()}`);
    console.log(`  Clean URLs: ${cleanUrls.length.toLocaleString()} (${(cleanUrls.length / perfData.data.rows.length * 100).toFixed(1)}%)`);
    console.log(`  Duplicate URLs: ${duplicateUrls.length.toLocaleString()} (${(duplicateUrls.length / perfData.data.rows.length * 100).toFixed(1)}%)`);
    console.log('');

    // Click distribution
    console.log('👆 CLICK DISTRIBUTION:');
    console.log(`  Clean URL clicks: ${cleanClicks.toLocaleString()} (${(cleanClicks / totalClicks * 100).toFixed(1)}%)`);
    console.log(`  Duplicate URL clicks: ${duplicateClicks.toLocaleString()} (${(duplicateClicks / totalClicks * 100).toFixed(1)}%)`);
    console.log('');

    // Impression distribution
    console.log('👁️  IMPRESSION DISTRIBUTION:');
    console.log(`  Clean URL impressions: ${cleanImpressions.toLocaleString()} (${(cleanImpressions / totalImpressions * 100).toFixed(1)}%)`);
    console.log(`  Duplicate URL impressions: ${duplicateImpressions.toLocaleString()} (${(duplicateImpressions / totalImpressions * 100).toFixed(1)}%)`);
    console.log('');

    // Load previous week's data for comparison
    let previousData = null;
    if (fs.existsSync(LOG_FILE)) {
      const logs = fs.readFileSync(LOG_FILE, 'utf-8')
        .trim()
        .split('\n')
        .filter(line => line)
        .map(line => JSON.parse(line));

      if (logs.length > 0) {
        previousData = logs[logs.length - 1];
      }
    }

    // Progress tracking
    console.log('📈 PROGRESS TRACKING:');
    if (previousData) {
      const clickChange = ((totalClicks - previousData.totalClicks) / previousData.totalClicks * 100);
      const duplicateChange = ((duplicateUrls.length - previousData.duplicateUrlCount) / previousData.duplicateUrlCount * 100);

      console.log(`  Traffic change: ${clickChange >= 0 ? '+' : ''}${clickChange.toFixed(1)}% from last week`);
      console.log(`  Duplicate URL change: ${duplicateChange >= 0 ? '+' : ''}${duplicateChange.toFixed(1)}% from last week`);
      console.log('');
    }

    // Goals and alerts
    console.log('🎯 GOALS:');

    const trafficStatus = totalClicks >= BASELINE_CLICKS ? '✅ ON TRACK' : '⚠️  BELOW BASELINE';
    console.log(`  Preserve traffic (≥36k clicks): ${trafficStatus}`);

    const cleanTrafficPercent = (cleanClicks / totalClicks * 100);
    const cleanUrlStatus = cleanTrafficPercent >= 90 ? '✅ ACHIEVED' : `⏳ ${cleanTrafficPercent.toFixed(1)}% (target: 90%)`;
    console.log(`  Shift to clean URLs: ${cleanUrlStatus}`);

    const deindexTarget = Math.floor(356000 * 0.7); // 70% reduction target
    const duplicateEstimate = duplicateUrls.length * 6; // Rough estimate (only showing URLs with traffic)
    const deindexStatus = duplicateEstimate <= deindexTarget ? '✅ ON TRACK' : `⏳ ${duplicateEstimate.toLocaleString()} remaining`;
    console.log(`  Deindex duplicates (target: 511k → 155k): ${deindexStatus}`);
    console.log('');

    // Alerts
    const alerts = [];

    if (totalClicks < BASELINE_CLICKS) {
      alerts.push('⚠️  ALERT: Traffic below baseline! Investigate immediately.');
    }

    if (previousData && totalClicks < previousData.totalClicks * 0.95) {
      alerts.push('⚠️  ALERT: Traffic dropped >5% from last week! Consider rollback.');
    }

    if (duplicateUrls.length > perfData.data.rows.length * 0.5 && previousData && duplicateUrls.length >= previousData.duplicateUrlCount) {
      alerts.push('⚠️  WARNING: Duplicate deindexing stalled. May need GSC removals.');
    }

    if (alerts.length > 0) {
      console.log('🚨 ALERTS:');
      alerts.forEach(alert => console.log(`  ${alert}`));
      console.log('');
    }

    // Sample duplicate URLs
    if (duplicateUrls.length > 0) {
      console.log('🔍 SAMPLE DUPLICATE URLs (should be deindexing):');
      duplicateUrls.slice(0, 10).forEach((row, i) => {
        console.log(`  ${i + 1}. ${row.keys[0]} (${row.clicks} clicks)`);
      });
      console.log('');
    }

    // Save to log file
    const report = {
      date: endDate,
      startDate,
      totalClicks,
      totalImpressions,
      avgPosition: parseFloat(avgPosition.toFixed(2)),
      cleanClicks,
      duplicateClicks,
      cleanUrlCount: cleanUrls.length,
      duplicateUrlCount: duplicateUrls.length,
      cleanTrafficPercent: parseFloat(cleanTrafficPercent.toFixed(1)),
      alerts: alerts.length,
    };

    fs.appendFileSync(LOG_FILE, JSON.stringify(report) + '\n');
    console.log(`💾 Report saved to: ${LOG_FILE}`);

    console.log('');
    console.log('='.repeat(70));
    console.log('');
    console.log('📋 NEXT STEPS:');
    console.log('  1. Review alerts (if any)');
    console.log('  2. Check Google Search Console for indexing coverage');
    console.log('  3. Monitor duplicate URL samples for deindexing progress');
    console.log('  4. Run this script again next week');
    console.log('');
    console.log('='.repeat(70));

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.code === 'ENOENT') {
      console.error('');
      console.error('Make sure google-service-account.json exists in the root directory.');
    }
    process.exit(1);
  }
}

generateWeeklyReport().catch(console.error);
