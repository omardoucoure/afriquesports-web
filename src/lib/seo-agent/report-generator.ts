/**
 * Report Generator - SEO Agent Component
 *
 * Generates and emails SEO performance reports:
 * - Daily summaries (quick overview)
 * - Weekly reports (detailed analysis)
 */

import { createClient } from '@supabase/supabase-js';
import { AnalyticsTracker } from './analytics-tracker';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const REPORT_EMAIL = 'oxmo88@gmail.com';

export class ReportGenerator {
  private analyticsTracker = new AnalyticsTracker();

  /**
   * Generate and send daily summary report
   * Quick overview of yesterday's performance
   */
  async sendDailySummary(): Promise<boolean> {
    try {
      console.log('📊 Generating daily summary report...');

      // Get yesterday's date
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      // Get yesterday's metrics
      const { data: yesterdayMetrics } = await supabase
        .from('seo_metrics_daily')
        .select('*')
        .eq('date', yesterdayStr);

      if (!yesterdayMetrics || yesterdayMetrics.length === 0) {
        console.log('No data for yesterday, skipping daily report');
        return false;
      }

      // Calculate totals
      const totals = yesterdayMetrics.reduce((acc, m) => ({
        clicks: acc.clicks + m.clicks,
        impressions: acc.impressions + m.impressions
      }), { clicks: 0, impressions: 0 });

      // Get France stats
      const franceMetrics = yesterdayMetrics.filter(m => m.country === 'fra');
      const franceClicks = franceMetrics.reduce((sum, m) => sum + m.clicks, 0);
      const francePosition = franceMetrics.length > 0
        ? (franceMetrics.reduce((sum, m) => sum + m.position, 0) / franceMetrics.length).toFixed(2)
        : 'N/A';

      // Get recent alerts
      const { data: alerts } = await supabase
        .from('seo_alerts')
        .select('*')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      // Send email
      const emailBody = this.formatDailySummary({
        date: yesterdayStr,
        totalClicks: totals.clicks,
        totalImpressions: totals.impressions,
        franceClicks,
        francePosition,
        alerts: alerts || []
      });

      await this.sendEmail(
        `📊 Daily SEO Summary - ${yesterdayStr}`,
        emailBody
      );

      console.log('✅ Daily summary sent');
      return true;

    } catch (error: any) {
      console.error('Error generating daily summary:', error.message);
      return false;
    }
  }

  /**
   * Generate and send weekly detailed report
   * Comprehensive analysis with trends and recommendations
   */
  async sendWeeklyReport(): Promise<boolean> {
    try {
      console.log('📊 Generating weekly report...');

      const today = new Date();
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const todayStr = today.toISOString().split('T')[0];
      const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

      // Get this week's metrics
      const { data: thisWeek } = await supabase
        .from('seo_metrics_daily')
        .select('*')
        .gte('date', sevenDaysAgoStr)
        .lte('date', todayStr);

      // Get previous week's metrics for comparison
      const fourteenDaysAgo = new Date();
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
      const fourteenDaysAgoStr = fourteenDaysAgo.toISOString().split('T')[0];

      const { data: lastWeek } = await supabase
        .from('seo_metrics_daily')
        .select('*')
        .gte('date', fourteenDaysAgoStr)
        .lt('date', sevenDaysAgoStr);

      // Calculate totals
      const thisWeekTotals = this.calculateTotals(thisWeek || []);
      const lastWeekTotals = this.calculateTotals(lastWeek || []);

      // Calculate week-over-week changes
      const clicksChange = this.calculatePercentChange(lastWeekTotals.clicks, thisWeekTotals.clicks);
      const impressionsChange = this.calculatePercentChange(lastWeekTotals.impressions, thisWeekTotals.impressions);

      // Get France stats
      const franceStats = await this.analyticsTracker.getCountryStats('fra', 7);

      // Get top countries
      const countryTotals = this.groupByCountry(thisWeek || []);
      const topCountries = Object.entries(countryTotals)
        .sort((a, b) => b[1].clicks - a[1].clicks)
        .slice(0, 5);

      // Get recent alerts
      const { data: alerts } = await supabase
        .from('seo_alerts')
        .select('*')
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(10);

      // Get indexing stats
      const { data: indexingStats } = await supabase
        .from('seo_indexing_status')
        .select('indexing_status')
        .gte('submitted_at', sevenDaysAgo.toISOString());

      // Send email
      const emailBody = this.formatWeeklyReport({
        dateRange: `${sevenDaysAgoStr} to ${todayStr}`,
        thisWeek: thisWeekTotals,
        lastWeek: lastWeekTotals,
        clicksChange,
        impressionsChange,
        franceStats,
        topCountries,
        alerts: alerts || [],
        indexingStats: indexingStats || []
      });

      await this.sendEmail(
        `📈 Weekly SEO Report - Week of ${sevenDaysAgoStr}`,
        emailBody
      );

      console.log('✅ Weekly report sent');
      return true;

    } catch (error: any) {
      console.error('Error generating weekly report:', error.message);
      return false;
    }
  }

  /**
   * Send email using Resend API
   */
  private async sendEmail(subject: string, htmlBody: string): Promise<boolean> {
    try {
      const resendApiKey = process.env.RESEND_API_KEY;

      if (!resendApiKey) {
        console.warn('RESEND_API_KEY not configured, skipping email report');
        return false;
      }

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${resendApiKey}`
        },
        body: JSON.stringify({
          from: 'SEO Agent <seo@afriquesports.net>',
          to: [REPORT_EMAIL],
          subject,
          html: htmlBody
        })
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Resend API error:', error);
        return false;
      }

      console.log(`✅ Email sent to ${REPORT_EMAIL}`);
      return true;

    } catch (error: any) {
      console.error('Error sending email:', error.message);
      return false;
    }
  }

  /**
   * Format daily summary email
   */
  private formatDailySummary(data: any): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: system-ui, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #345C00; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .metric-card { background: #f9fafb; padding: 15px; border-radius: 6px; margin: 10px 0; }
            .metric-value { font-size: 32px; font-weight: bold; color: #345C00; }
            .metric-label { color: #666; font-size: 14px; }
            .alert { background: #fef2f2; border-left: 4px solid #dc2626; padding: 12px; margin: 10px 0; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">📊 Daily SEO Summary</h1>
              <p style="margin: 5px 0 0 0; opacity: 0.9;">${data.date}</p>
            </div>

            <div style="padding: 20px; background: white;">
              <h2>Performance Overview</h2>

              <div class="metric-card">
                <div class="metric-value">${data.totalClicks.toLocaleString()}</div>
                <div class="metric-label">Total Clicks</div>
              </div>

              <div class="metric-card">
                <div class="metric-value">${data.totalImpressions.toLocaleString()}</div>
                <div class="metric-label">Total Impressions</div>
              </div>

              <h3>France Performance</h3>
              <div class="metric-card">
                <div class="metric-value">${data.franceClicks.toLocaleString()}</div>
                <div class="metric-label">France Clicks</div>
              </div>
              <div class="metric-card">
                <div class="metric-value">${data.francePosition}</div>
                <div class="metric-label">Average Position</div>
              </div>

              ${data.alerts.length > 0 ? `
                <h3>Recent Alerts (${data.alerts.length})</h3>
                ${data.alerts.map((alert: any) => `
                  <div class="alert">
                    <strong>${alert.severity.toUpperCase()}:</strong> ${alert.message}
                  </div>
                `).join('')}
              ` : '<p style="color: #10b981;">✅ No alerts in the last 24 hours</p>'}

              <p style="margin-top: 20px;">
                <a href="https://www.afriquesports.net/api/admin/seo-dashboard"
                   style="background: #345C00; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  View Full Dashboard →
                </a>
              </p>
            </div>

            <div class="footer">
              <p>Afrique Sports SEO Agent - Daily Summary</p>
              <p>${new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Dakar' })}</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Format weekly report email
   */
  private formatWeeklyReport(data: any): string {
    const changeIcon = (change: number) => change > 0 ? '📈' : change < 0 ? '📉' : '➡️';
    const changeColor = (change: number) => change > 0 ? '#10b981' : change < 0 ? '#dc2626' : '#6b7280';

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: system-ui, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 700px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #345C00 0%, #9DFF20 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
            .section { background: white; padding: 20px; margin: 10px 0; }
            .metric-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 15px 0; }
            .metric-card { background: #f9fafb; padding: 15px; border-radius: 6px; }
            .metric-value { font-size: 28px; font-weight: bold; color: #345C00; }
            .metric-change { font-size: 14px; font-weight: bold; margin-top: 5px; }
            .country-list { list-style: none; padding: 0; }
            .country-item { padding: 10px; background: #f9fafb; margin: 5px 0; border-radius: 4px; }
            table { width: 100%; border-collapse: collapse; margin: 15px 0; }
            th, td { padding: 10px; text-align: left; border-bottom: 1px solid #e5e7eb; }
            th { background: #f9fafb; font-weight: 600; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">📈 Weekly SEO Report</h1>
              <p style="margin: 5px 0 0 0; opacity: 0.9;">${data.dateRange}</p>
            </div>

            <div class="section">
              <h2>Performance Highlights</h2>
              <div class="metric-grid">
                <div class="metric-card">
                  <div class="metric-value">${data.thisWeek.clicks.toLocaleString()}</div>
                  <div style="color: #666;">Total Clicks</div>
                  <div class="metric-change" style="color: ${changeColor(data.clicksChange)}">
                    ${changeIcon(data.clicksChange)} ${data.clicksChange > 0 ? '+' : ''}${data.clicksChange.toFixed(1)}% vs last week
                  </div>
                </div>
                <div class="metric-card">
                  <div class="metric-value">${data.thisWeek.impressions.toLocaleString()}</div>
                  <div style="color: #666;">Total Impressions</div>
                  <div class="metric-change" style="color: ${changeColor(data.impressionsChange)}">
                    ${changeIcon(data.impressionsChange)} ${data.impressionsChange > 0 ? '+' : ''}${data.impressionsChange.toFixed(1)}% vs last week
                  </div>
                </div>
              </div>
            </div>

            <div class="section">
              <h2>France Performance</h2>
              ${data.franceStats ? `
                <div class="metric-grid">
                  <div class="metric-card">
                    <div class="metric-value">${data.franceStats.totalClicks.toLocaleString()}</div>
                    <div style="color: #666;">Total Clicks (7 days)</div>
                  </div>
                  <div class="metric-card">
                    <div class="metric-value">${data.franceStats.avgPosition}</div>
                    <div style="color: #666;">Average Position</div>
                  </div>
                </div>
              ` : '<p>No France data available</p>'}
            </div>

            <div class="section">
              <h2>Top 5 Countries</h2>
              <table>
                <thead>
                  <tr>
                    <th>Country</th>
                    <th>Clicks</th>
                    <th>Impressions</th>
                    <th>CTR</th>
                  </tr>
                </thead>
                <tbody>
                  ${data.topCountries.map(([country, stats]: [string, any]) => `
                    <tr>
                      <td><strong>${country.toUpperCase()}</strong></td>
                      <td>${stats.clicks.toLocaleString()}</td>
                      <td>${stats.impressions.toLocaleString()}</td>
                      <td>${((stats.clicks / stats.impressions) * 100).toFixed(2)}%</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>

            ${data.alerts.length > 0 ? `
              <div class="section">
                <h2>Alerts This Week (${data.alerts.length})</h2>
                ${data.alerts.slice(0, 5).map((alert: any) => `
                  <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 12px; margin: 8px 0; border-radius: 4px;">
                    <strong>${alert.severity.toUpperCase()}:</strong> ${alert.message}
                    <div style="color: #666; font-size: 12px; margin-top: 4px;">
                      ${new Date(alert.created_at).toLocaleString('fr-FR')}
                    </div>
                  </div>
                `).join('')}
              </div>
            ` : ''}

            <div class="section">
              <h2>Indexing Summary</h2>
              <p>
                <strong>Total URLs submitted:</strong> ${data.indexingStats.length}<br>
                <strong>Indexed:</strong> ${data.indexingStats.filter((s: any) => s.indexing_status === 'indexed').length}<br>
                <strong>Pending:</strong> ${data.indexingStats.filter((s: any) => s.indexing_status === 'submitted').length}<br>
                <strong>Errors:</strong> ${data.indexingStats.filter((s: any) => s.indexing_status === 'error').length}
              </p>
            </div>

            <div style="background: #f0fdf4; padding: 20px; border-radius: 6px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #166534;">💡 Recommendations</h3>
              <ul>
                ${data.clicksChange < 0 ? '<li>Traffic is down this week - review recent content changes</li>' : ''}
                ${data.franceStats && parseFloat(data.franceStats.avgPosition) > 10 ? '<li>France average position > 10 - optimize title tags for top queries</li>' : ''}
                ${data.indexingStats.filter((s: any) => s.indexing_status === 'error').length > 0 ? '<li>Review indexing errors in dashboard</li>' : ''}
                <li>Continue monitoring France position (target: &lt;10)</li>
                <li>Focus on increasing African country traffic</li>
              </ul>
            </div>

            <p style="text-align: center; margin: 30px 0;">
              <a href="https://www.afriquesports.net/api/admin/seo-dashboard"
                 style="background: #345C00; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                View Full SEO Dashboard →
              </a>
            </p>

            <div class="footer">
              <p>Afrique Sports SEO Agent - Weekly Report</p>
              <p>${new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Dakar' })}</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Helper: Calculate totals from metrics array
   */
  private calculateTotals(metrics: any[]) {
    return metrics.reduce((acc, m) => ({
      clicks: acc.clicks + (m.clicks || 0),
      impressions: acc.impressions + (m.impressions || 0),
      avgCtr: acc.avgCtr + (m.ctr || 0),
      avgPosition: acc.avgPosition + (m.position || 0),
      count: acc.count + 1
    }), { clicks: 0, impressions: 0, avgCtr: 0, avgPosition: 0, count: 0 });
  }

  /**
   * Helper: Calculate percent change
   */
  private calculatePercentChange(oldValue: number, newValue: number): number {
    if (oldValue === 0) return 0;
    return ((newValue - oldValue) / oldValue) * 100;
  }

  /**
   * Helper: Group metrics by country
   */
  private groupByCountry(metrics: any[]) {
    const byCountry: Record<string, any> = {};

    for (const metric of metrics) {
      if (!byCountry[metric.country]) {
        byCountry[metric.country] = { clicks: 0, impressions: 0 };
      }
      byCountry[metric.country].clicks += metric.clicks;
      byCountry[metric.country].impressions += metric.impressions;
    }

    return byCountry;
  }
}
