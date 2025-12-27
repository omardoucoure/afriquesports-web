/**
 * Analytics Tracker - SEO Agent Component
 *
 * Fetches daily performance metrics from Google Search Console
 * Stores historical data in Supabase for trend analysis
 */

import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface DailyMetric {
  date: string;
  country: string;
  device: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface AnalyticsTrackerResult {
  metricsCollected: number;
  errors: string[];
  dateRange: { start: string; end: string };
}

export class AnalyticsTracker {
  private auth: any;

  constructor() {
    // Load credentials from service account file
    try {
      const serviceAccount = require('../../../google-service-account.json');

      this.auth = new google.auth.GoogleAuth({
        credentials: serviceAccount,
        scopes: ['https://www.googleapis.com/auth/webmasters.readonly']
      });
    } catch (error) {
      console.error('Error loading Google service account:', error);
    }
  }

  /**
   * Fetch yesterday's metrics from Google Search Console
   * (GSC has a 2-3 day delay, so we fetch yesterday's data)
   */
  async fetchYesterdayMetrics(): Promise<AnalyticsTrackerResult> {
    const result: AnalyticsTrackerResult = {
      metricsCollected: 0,
      errors: [],
      dateRange: { start: '', end: '' }
    };

    if (!this.auth) {
      result.errors.push('Google Search Console authentication not configured');
      return result;
    }

    try {
      console.log('📊 AnalyticsTracker: Fetching yesterday\'s metrics...');

      // Calculate date range (yesterday)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const dateStr = yesterday.toISOString().split('T')[0];

      result.dateRange = { start: dateStr, end: dateStr };

      const searchconsole = google.searchconsole({ version: 'v1', auth: this.auth });

      // Fetch metrics grouped by country and device
      const response = await searchconsole.searchanalytics.query({
        siteUrl: 'sc-domain:afriquesports.net',
        requestBody: {
          startDate: dateStr,
          endDate: dateStr,
          dimensions: ['country', 'device'],
          rowLimit: 1000,
        }
      });

      const rows = response.data.rows || [];
      console.log(`📈 Found ${rows.length} metric rows for ${dateStr}`);

      // Store metrics in database
      for (const row of rows) {
        const [country, device] = row.keys || [];
        const clicks = row.clicks ?? 0;
        const impressions = row.impressions ?? 0;
        const ctr = row.ctr ?? 0;
        const position = row.position ?? 0;

        try {
          const { error } = await supabase
            .from('seo_metrics_daily')
            .upsert({
              date: dateStr,
              country,
              device,
              clicks,
              impressions,
              ctr: Number(ctr.toFixed(4)),
              position: Number(position.toFixed(2)),
              created_at: new Date().toISOString()
            }, {
              onConflict: 'date,country,device'
            });

          if (error) {
            result.errors.push(`Error storing metric for ${country}/${device}: ${error.message}`);
          } else {
            result.metricsCollected++;
          }

        } catch (error: any) {
          result.errors.push(`Error processing ${country}/${device}: ${error.message}`);
        }
      }

      console.log(`✅ AnalyticsTracker: Stored ${result.metricsCollected} metrics for ${dateStr}`);

      return result;
    } catch (error: any) {
      const errorMsg = `Fatal error in AnalyticsTracker: ${error.message}`;
      result.errors.push(errorMsg);
      console.error(`❌ ${errorMsg}`);
      return result;
    }
  }

  /**
   * Fetch metrics for a specific date range
   * Useful for backfilling historical data
   */
  async fetchDateRange(startDate: string, endDate: string): Promise<AnalyticsTrackerResult> {
    const result: AnalyticsTrackerResult = {
      metricsCollected: 0,
      errors: [],
      dateRange: { start: startDate, end: endDate }
    };

    if (!this.auth) {
      result.errors.push('Google Search Console authentication not configured');
      return result;
    }

    try {
      console.log(`📊 AnalyticsTracker: Fetching metrics from ${startDate} to ${endDate}...`);

      const searchconsole = google.searchconsole({ version: 'v1', auth: this.auth });

      const response = await searchconsole.searchanalytics.query({
        siteUrl: 'sc-domain:afriquesports.net',
        requestBody: {
          startDate,
          endDate,
          dimensions: ['date', 'country', 'device'],
          rowLimit: 25000,
        }
      });

      const rows = response.data.rows || [];
      console.log(`📈 Found ${rows.length} metric rows`);

      // Store metrics in database
      for (const row of rows) {
        const [date, country, device] = row.keys || [];
        const clicks = row.clicks ?? 0;
        const impressions = row.impressions ?? 0;
        const ctr = row.ctr ?? 0;
        const position = row.position ?? 0;

        try {
          const { error } = await supabase
            .from('seo_metrics_daily')
            .upsert({
              date,
              country,
              device,
              clicks,
              impressions,
              ctr: Number(ctr.toFixed(4)),
              position: Number(position.toFixed(2)),
              created_at: new Date().toISOString()
            }, {
              onConflict: 'date,country,device'
            });

          if (error) {
            result.errors.push(`Error storing metric for ${date}/${country}/${device}: ${error.message}`);
          } else {
            result.metricsCollected++;
          }

        } catch (error: any) {
          result.errors.push(`Error processing ${date}/${country}/${device}: ${error.message}`);
        }
      }

      console.log(`✅ AnalyticsTracker: Stored ${result.metricsCollected} metrics`);

      return result;
    } catch (error: any) {
      const errorMsg = `Fatal error in AnalyticsTracker: ${error.message}`;
      result.errors.push(errorMsg);
      console.error(`❌ ${errorMsg}`);
      return result;
    }
  }

  /**
   * Get summary statistics for a specific country
   */
  async getCountryStats(country: string, days: number = 7) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('seo_metrics_daily')
        .select('*')
        .eq('country', country)
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching country stats:', error);
        return null;
      }

      // Calculate totals
      const totals = data?.reduce((acc, row) => ({
        clicks: acc.clicks + row.clicks,
        impressions: acc.impressions + row.impressions,
        avgCtr: acc.avgCtr + row.ctr,
        avgPosition: acc.avgPosition + row.position,
        count: acc.count + 1
      }), { clicks: 0, impressions: 0, avgCtr: 0, avgPosition: 0, count: 0 });

      return {
        country,
        days,
        totalClicks: totals?.clicks || 0,
        totalImpressions: totals?.impressions || 0,
        avgCtr: totals ? (totals.avgCtr / totals.count).toFixed(4) : 0,
        avgPosition: totals ? (totals.avgPosition / totals.count).toFixed(2) : 0,
        dailyMetrics: data
      };
    } catch (error: any) {
      console.error('Error getting country stats:', error.message);
      return null;
    }
  }

  /**
   * Detect traffic drops (>20% decrease from previous day)
   */
  async detectTrafficDrops() {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const dayBefore = new Date();
      dayBefore.setDate(dayBefore.getDate() - 2);
      const dayBeforeStr = dayBefore.toISOString().split('T')[0];

      // Get yesterday's metrics
      const { data: yesterdayData } = await supabase
        .from('seo_metrics_daily')
        .select('country, clicks')
        .eq('date', yesterdayStr);

      // Get day before metrics
      const { data: dayBeforeData } = await supabase
        .from('seo_metrics_daily')
        .select('country, clicks')
        .eq('date', dayBeforeStr);

      // Group by country
      const yesterdayByCountry = new Map();
      yesterdayData?.forEach(m => {
        const current = yesterdayByCountry.get(m.country) || 0;
        yesterdayByCountry.set(m.country, current + m.clicks);
      });

      const dayBeforeByCountry = new Map();
      dayBeforeData?.forEach(m => {
        const current = dayBeforeByCountry.get(m.country) || 0;
        dayBeforeByCountry.set(m.country, current + m.clicks);
      });

      // Detect drops >20%
      const drops = [];
      for (const [country, yesterdayClicks] of yesterdayByCountry) {
        const dayBeforeClicks = dayBeforeByCountry.get(country) || 0;

        if (dayBeforeClicks > 0 && yesterdayClicks < dayBeforeClicks * 0.8) {
          const dropPercent = ((dayBeforeClicks - yesterdayClicks) / dayBeforeClicks * 100).toFixed(1);
          drops.push({
            country,
            yesterdayClicks,
            dayBeforeClicks,
            dropPercent
          });
        }
      }

      return drops;
    } catch (error: any) {
      console.error('Error detecting traffic drops:', error.message);
      return [];
    }
  }
}
