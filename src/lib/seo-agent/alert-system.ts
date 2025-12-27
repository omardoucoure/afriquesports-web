/**
 * Alert System - SEO Agent Component
 *
 * Sends email notifications for critical SEO events:
 * - Traffic drops >20%
 * - Position drops >3 positions for top queries
 * - Indexing errors
 * - Core Web Vitals regression
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ALERT_EMAIL = 'oxmo88@gmail.com';

export interface Alert {
  type: 'traffic_drop' | 'position_drop' | 'indexing_error' | 'core_web_vitals';
  severity: 'critical' | 'warning' | 'info';
  message: string;
  metadata: any;
}

export class AlertSystem {
  /**
   * Create an alert and send email notification
   */
  async createAlert(alert: Alert): Promise<boolean> {
    try {
      // Store alert in database
      const { error } = await supabase
        .from('seo_alerts')
        .insert({
          alert_type: alert.type,
          severity: alert.severity,
          message: alert.message,
          metadata: alert.metadata,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error storing alert:', error);
        return false;
      }

      // Send email notification for critical and warning alerts
      if (alert.severity === 'critical' || alert.severity === 'warning') {
        await this.sendEmailAlert(alert);
      }

      return true;
    } catch (error: any) {
      console.error('Error creating alert:', error.message);
      return false;
    }
  }

  /**
   * Send email alert using Resend
   */
  private async sendEmailAlert(alert: Alert): Promise<boolean> {
    try {
      // Use fetch to call Resend API directly (no SDK needed)
      const resendApiKey = process.env.RESEND_API_KEY;

      if (!resendApiKey) {
        console.warn('RESEND_API_KEY not configured, skipping email alert');
        return false;
      }

      const emailSubject = `🚨 SEO Alert: ${alert.message}`;
      const emailBody = this.formatEmailBody(alert);

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${resendApiKey}`
        },
        body: JSON.stringify({
          from: 'SEO Agent <seo@afriquesports.net>',
          to: [ALERT_EMAIL],
          subject: emailSubject,
          html: emailBody
        })
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Resend API error:', error);
        return false;
      }

      console.log(`✅ Email alert sent to ${ALERT_EMAIL}`);
      return true;

    } catch (error: any) {
      console.error('Error sending email alert:', error.message);
      return false;
    }
  }

  /**
   * Format alert as HTML email
   */
  private formatEmailBody(alert: Alert): string {
    const severityColor = {
      critical: '#dc2626',
      warning: '#f59e0b',
      info: '#3b82f6'
    }[alert.severity];

    const severityIcon = {
      critical: '🚨',
      warning: '⚠️',
      info: 'ℹ️'
    }[alert.severity];

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: ${severityColor}; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
            .metadata { background: white; padding: 15px; border-radius: 6px; margin-top: 15px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
            code { background: #e5e7eb; padding: 2px 6px; border-radius: 3px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">${severityIcon} SEO Alert</h1>
              <p style="margin: 5px 0 0 0; opacity: 0.9;">${alert.severity.toUpperCase()}</p>
            </div>
            <div class="content">
              <h2>Alert Details</h2>
              <p><strong>Type:</strong> ${alert.type.replace(/_/g, ' ').toUpperCase()}</p>
              <p><strong>Message:</strong> ${alert.message}</p>

              ${alert.metadata ? `
                <div class="metadata">
                  <h3>Additional Information</h3>
                  <pre style="overflow-x: auto;">${JSON.stringify(alert.metadata, null, 2)}</pre>
                </div>
              ` : ''}

              <p style="margin-top: 20px;">
                <a href="https://www.afriquesports.net/api/admin/seo-dashboard"
                   style="background: #345C00; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  View SEO Dashboard →
                </a>
              </p>
            </div>
            <div class="footer">
              <p>This is an automated alert from the Afrique Sports SEO Agent</p>
              <p>Timestamp: ${new Date().toLocaleString('fr-FR', { timeZone: 'Africa/Dakar' })}</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Process traffic drops and create alerts
   */
  async processTrafficDrops(drops: any[]): Promise<number> {
    let alertsCreated = 0;

    for (const drop of drops) {
      const dropPercent = parseFloat(drop.dropPercent);

      // Critical if >30% drop, warning if >20%
      const severity = dropPercent > 30 ? 'critical' : 'warning';

      const success = await this.createAlert({
        type: 'traffic_drop',
        severity,
        message: `${drop.country} traffic dropped ${drop.dropPercent}% (${drop.dayBeforeClicks} → ${drop.yesterdayClicks} clicks)`,
        metadata: drop
      });

      if (success) alertsCreated++;
    }

    return alertsCreated;
  }

  /**
   * Get recent alerts (last 24 hours)
   */
  async getRecentAlerts() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const { data, error } = await supabase
      .from('seo_alerts')
      .select('*')
      .gte('created_at', yesterday.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching recent alerts:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Get alert summary by severity
   */
  async getAlertSummary(days: number = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('seo_alerts')
      .select('severity')
      .gte('created_at', startDate.toISOString());

    if (error) return null;

    const summary = {
      critical: data?.filter(a => a.severity === 'critical').length || 0,
      warning: data?.filter(a => a.severity === 'warning').length || 0,
      info: data?.filter(a => a.severity === 'info').length || 0,
      total: data?.length || 0
    };

    return summary;
  }
}
