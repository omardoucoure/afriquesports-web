/**
 * SEO Agent Orchestrator
 *
 * Coordinates all SEO agent components:
 * - IndexingMonitor: Submits new articles for indexing
 * - AnalyticsTracker: Fetches daily GSC metrics
 * - MetadataAuditor: Detects SEO issues (future)
 * - AlertSystem: Sends notifications (future)
 */

import { IndexingMonitor } from './indexing-monitor';
import { AnalyticsTracker } from './analytics-tracker';
import { AlertSystem } from './alert-system';
import { ReportGenerator } from './report-generator';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface SEOAgentRunResult {
  runType: 'full' | 'realtime' | 'report';
  startedAt: Date;
  completedAt: Date;
  status: 'success' | 'error';
  metrics: {
    indexingMonitor?: any;
    analyticsTracker?: any;
    alertsCreated?: number;
  };
  errors: string[];
}

export class SEOAgentOrchestrator {
  private indexingMonitor = new IndexingMonitor();
  private analyticsTracker = new AnalyticsTracker();
  private alertSystem = new AlertSystem();
  private reportGenerator = new ReportGenerator();

  /**
   * Full daily run - all components
   * Runs every morning at 6am
   */
  async runFull(): Promise<SEOAgentRunResult> {
    const result: SEOAgentRunResult = {
      runType: 'full',
      startedAt: new Date(),
      completedAt: new Date(),
      status: 'success',
      metrics: {},
      errors: []
    };

    // Log run start
    const { data: runRecord } = await supabase
      .from('seo_agent_runs')
      .insert({
        run_type: 'full',
        started_at: result.startedAt.toISOString(),
        status: 'running'
      })
      .select()
      .single();

    const runId = runRecord?.id;

    try {
      console.log('🤖 SEO Agent: Starting full daily run...');

      // 1. Fetch yesterday's analytics
      console.log('\n📊 Step 1: Fetching analytics...');
      const analyticsResult = await this.analyticsTracker.fetchYesterdayMetrics();
      result.metrics.analyticsTracker = analyticsResult;

      if (analyticsResult.errors.length > 0) {
        result.errors.push(...analyticsResult.errors);
      }

      console.log(`✅ Analytics: Collected ${analyticsResult.metricsCollected} metrics`);

      // 2. Monitor and submit new articles
      console.log('\n📤 Step 2: Monitoring new articles...');
      const indexingResult = await this.indexingMonitor.monitorAndSubmit();
      result.metrics.indexingMonitor = indexingResult;

      if (indexingResult.errors.length > 0) {
        result.errors.push(...indexingResult.errors);
      }

      console.log(`✅ Indexing: Submitted ${indexingResult.articlesSubmitted}/${indexingResult.articlesFound} articles`);

      // 3. Check for traffic drops and create alerts
      console.log('\n🚨 Step 3: Checking for traffic drops...');
      const trafficDrops = await this.analyticsTracker.detectTrafficDrops();

      if (trafficDrops.length > 0) {
        console.log(`⚠️  Detected ${trafficDrops.length} traffic drops:`);
        const alertsCreated = await this.alertSystem.processTrafficDrops(trafficDrops);
        result.metrics.alertsCreated = alertsCreated;
        console.log(`📧 Created ${alertsCreated} alerts (emails sent)`);
      } else {
        console.log('✅ No significant traffic drops detected');
        result.metrics.alertsCreated = 0;
      }

      // 4. Get indexing stats
      console.log('\n📈 Step 4: Indexing statistics...');
      const indexingStats = await this.indexingMonitor.getStats();
      console.log(`   - Total indexed (7 days): ${indexingStats?.total || 0}`);
      console.log(`   - Submitted: ${indexingStats?.submitted || 0}`);
      console.log(`   - Indexed: ${indexingStats?.indexed || 0}`);
      console.log(`   - Errors: ${indexingStats?.errors || 0}`);

      // 5. Send daily summary email
      console.log('\n📧 Step 5: Sending daily summary email...');
      const dailySummarySent = await this.reportGenerator.sendDailySummary();
      console.log(dailySummarySent ? '✅ Daily summary sent' : '⚠️  Daily summary failed');

      result.completedAt = new Date();
      result.status = result.errors.length === 0 ? 'success' : 'error';

      console.log(`\n✅ SEO Agent: Full run completed in ${(result.completedAt.getTime() - result.startedAt.getTime()) / 1000}s`);

      // Update run record
      if (runId) {
        await supabase
          .from('seo_agent_runs')
          .update({
            completed_at: result.completedAt.toISOString(),
            status: result.status,
            metrics: result.metrics,
            error_message: result.errors.length > 0 ? result.errors.join('; ') : null
          })
          .eq('id', runId);
      }

      return result;

    } catch (error: any) {
      const errorMsg = `Fatal error in SEO Agent: ${error.message}`;
      result.errors.push(errorMsg);
      result.status = 'error';
      result.completedAt = new Date();

      console.error(`❌ ${errorMsg}`);

      // Update run record
      if (runId) {
        await supabase
          .from('seo_agent_runs')
          .update({
            completed_at: result.completedAt.toISOString(),
            status: 'error',
            error_message: error.message
          })
          .eq('id', runId);
      }

      return result;
    }
  }

  /**
   * Realtime monitoring - lightweight checks
   * Runs hourly during business hours (9am-9pm)
   */
  async runRealtime(): Promise<SEOAgentRunResult> {
    const result: SEOAgentRunResult = {
      runType: 'realtime',
      startedAt: new Date(),
      completedAt: new Date(),
      status: 'success',
      metrics: {},
      errors: []
    };

    try {
      console.log('⚡ SEO Agent: Starting realtime check...');

      // Only check for very recent articles (last 2 hours)
      const twoHoursAgo = new Date();
      twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);

      // Quick indexing check for recent articles
      const indexingResult = await this.indexingMonitor.monitorAndSubmit();
      result.metrics.indexingMonitor = indexingResult;

      console.log(`✅ Realtime: Checked ${indexingResult.articlesFound} recent articles`);

      result.completedAt = new Date();

      // Log to database (lightweight, no detailed metrics)
      await supabase
        .from('seo_agent_runs')
        .insert({
          run_type: 'realtime',
          started_at: result.startedAt.toISOString(),
          completed_at: result.completedAt.toISOString(),
          status: result.status,
          metrics: { articlesChecked: indexingResult.articlesFound }
        });

      return result;

    } catch (error: any) {
      result.errors.push(error.message);
      result.status = 'error';
      result.completedAt = new Date();
      return result;
    }
  }

  /**
   * Get agent status and recent performance
   */
  async getStatus() {
    try {
      // Get last 5 runs
      const { data: recentRuns } = await supabase
        .from('seo_agent_runs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(5);

      // Get recent alerts
      const { data: recentAlerts } = await supabase
        .from('seo_alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      // Get indexing stats
      const indexingStats = await this.indexingMonitor.getStats();

      // Get France stats (last 7 days)
      const franceStats = await this.analyticsTracker.getCountryStats('fra', 7);

      return {
        lastRun: recentRuns?.[0],
        recentRuns,
        recentAlerts,
        indexingStats,
        franceStats,
        agentActive: true
      };
    } catch (error: any) {
      console.error('Error getting agent status:', error.message);
      return null;
    }
  }
}
