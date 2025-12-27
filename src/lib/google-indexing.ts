/**
 * Google Indexing API Wrapper
 *
 * Enables instant indexing of match pages and articles.
 * Requires Google Cloud service account with Indexing API enabled.
 *
 * Setup Instructions:
 * 1. Create Google Cloud project
 * 2. Enable Indexing API
 * 3. Create service account with "Editor" role
 * 4. Download JSON key
 * 5. Add service account email to Google Search Console as "Owner"
 * 6. Add credentials to environment variables
 *
 * Environment Variables Required:
 * - GOOGLE_INDEXING_CLIENT_EMAIL
 * - GOOGLE_INDEXING_PRIVATE_KEY
 * - GOOGLE_INDEXING_PROJECT_ID
 */

import { google } from 'googleapis';
import { createClient } from '@supabase/supabase-js';

const SITE_URL = "https://www.afriquesports.net";

// Supabase client for tracking indexing status
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export class GoogleIndexingAPI {
  private auth: any;

  constructor() {
    // Check if credentials are available
    if (!process.env.GOOGLE_INDEXING_CLIENT_EMAIL ||
        !process.env.GOOGLE_INDEXING_PRIVATE_KEY ||
        !process.env.GOOGLE_INDEXING_PROJECT_ID) {
      console.warn('Google Indexing API credentials not configured. Instant indexing will be skipped.');
      return;
    }

    try {
      // Create JWT auth client
      this.auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: process.env.GOOGLE_INDEXING_CLIENT_EMAIL,
          private_key: process.env.GOOGLE_INDEXING_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          project_id: process.env.GOOGLE_INDEXING_PROJECT_ID
        },
        scopes: ['https://www.googleapis.com/auth/indexing']
      });
    } catch (error) {
      console.error('Error initializing Google Indexing API:', error);
    }
  }

  /**
   * Notify Google that a URL has been updated
   */
  async notifyUpdate(url: string): Promise<boolean> {
    if (!this.auth) {
      console.warn('Google Indexing API not configured, skipping notification for:', url);
      return false;
    }

    try {
      const indexing = google.indexing({ version: 'v3', auth: this.auth });

      const response = await indexing.urlNotifications.publish({
        requestBody: {
          url,
          type: 'URL_UPDATED'
        }
      });

      console.log('✅ Google Indexing API notification sent:', {
        url,
        status: response.status,
        data: response.data
      });

      return true;
    } catch (error: any) {
      console.error('❌ Error sending indexing notification:', {
        url,
        error: error.message,
        code: error.code
      });
      return false;
    }
  }

  /**
   * Notify Google that a URL has been deleted
   */
  async notifyDelete(url: string): Promise<boolean> {
    if (!this.auth) {
      console.warn('Google Indexing API not configured, skipping deletion for:', url);
      return false;
    }

    try {
      const indexing = google.indexing({ version: 'v3', auth: this.auth });

      const response = await indexing.urlNotifications.publish({
        requestBody: {
          url,
          type: 'URL_DELETED'
        }
      });

      console.log('✅ Google Indexing API deletion sent:', {
        url,
        status: response.status
      });

      return true;
    } catch (error: any) {
      console.error('❌ Error sending deletion notification:', {
        url,
        error: error.message
      });
      return false;
    }
  }

  /**
   * Get notification metadata for a URL
   */
  async getMetadata(url: string) {
    if (!this.auth) {
      return null;
    }

    try {
      const indexing = google.indexing({ version: 'v3', auth: this.auth });

      const response = await indexing.urlNotifications.getMetadata({
        url
      });

      return response.data;
    } catch (error: any) {
      console.error('Error getting indexing metadata:', error.message);
      return null;
    }
  }

  /**
   * Notify Google about a match page going live
   */
  async notifyMatchLive(matchId: string, locale: string = 'fr'): Promise<boolean> {
    // French (default locale) has no prefix, other locales have prefix
    const url = locale === 'fr'
      ? `${SITE_URL}/can-2025/match/${matchId}`
      : `${SITE_URL}/${locale}/can-2025/match/${matchId}`;
    return this.notifyUpdate(url);
  }

  /**
   * Notify Google about match status changes for all locales
   */
  async notifyMatchAllLocales(matchId: string): Promise<boolean> {
    const locales = ['fr', 'en', 'es', 'ar'];
    const results = await Promise.allSettled(
      locales.map(locale => this.notifyMatchLive(matchId, locale))
    );

    const successful = results.filter(r => r.status === 'fulfilled' && r.value).length;
    console.log(`Notified ${successful}/${locales.length} locales for match ${matchId}`);

    return successful > 0;
  }

  /**
   * Batch notify multiple match URLs (respects rate limits)
   */
  async notifyBatch(matchIds: string[], delayMs: number = 300): Promise<number> {
    let successCount = 0;

    for (const matchId of matchIds) {
      const success = await this.notifyMatchAllLocales(matchId);
      if (success) successCount++;

      // Respect rate limits (200 requests/min = ~300ms per request)
      if (delayMs > 0 && matchIds.indexOf(matchId) < matchIds.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    console.log(`Batch indexing complete: ${successCount}/${matchIds.length} matches notified`);
    return successCount;
  }

  /**
   * Notify Google about a new or updated article
   * Logs submission to database for tracking
   */
  async notifyArticlePublished(category: string, slug: string, locale: string = 'fr'): Promise<boolean> {
    // Construct article URL
    const url = locale === 'fr'
      ? `${SITE_URL}/${category}/${slug}`
      : `${SITE_URL}/${locale}/${category}/${slug}`;

    try {
      // Submit to Google Indexing API
      const success = await this.notifyUpdate(url);

      // Track in database
      if (supabase) {
        await supabase.from('seo_indexing_status').upsert({
          url,
          submitted_at: new Date().toISOString(),
          indexing_status: success ? 'submitted' : 'error',
          last_checked_at: new Date().toISOString(),
          error_message: success ? null : 'Failed to submit to Indexing API'
        }, {
          onConflict: 'url'
        });
      }

      return success;
    } catch (error: any) {
      console.error('Error notifying article:', {
        url,
        error: error.message
      });

      // Log error to database
      if (supabase) {
        await supabase.from('seo_indexing_status').upsert({
          url,
          submitted_at: new Date().toISOString(),
          indexing_status: 'error',
          last_checked_at: new Date().toISOString(),
          error_message: error.message
        }, {
          onConflict: 'url'
        });
      }

      return false;
    }
  }

  /**
   * Notify Google about article for all locales
   */
  async notifyArticleAllLocales(category: string, slug: string): Promise<boolean> {
    const locales = ['fr', 'en', 'es'];
    const results = await Promise.allSettled(
      locales.map(locale => this.notifyArticlePublished(category, slug, locale))
    );

    const successful = results.filter(r => r.status === 'fulfilled' && r.value).length;
    console.log(`Notified ${successful}/${locales.length} locales for article ${category}/${slug}`);

    return successful > 0;
  }

  /**
   * Batch notify multiple article URLs (respects rate limits)
   * articles: Array of { category: string, slug: string }
   */
  async notifyArticleBatch(
    articles: Array<{ category: string; slug: string }>,
    delayMs: number = 300
  ): Promise<number> {
    let successCount = 0;

    for (const article of articles) {
      const success = await this.notifyArticleAllLocales(article.category, article.slug);
      if (success) successCount++;

      // Respect rate limits (200 requests/min = ~300ms per request)
      if (delayMs > 0 && articles.indexOf(article) < articles.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    console.log(`Batch article indexing complete: ${successCount}/${articles.length} articles notified`);
    return successCount;
  }
}

// Singleton instance
let indexingAPI: GoogleIndexingAPI | null = null;

export function getGoogleIndexingAPI(): GoogleIndexingAPI {
  if (!indexingAPI) {
    indexingAPI = new GoogleIndexingAPI();
  }
  return indexingAPI;
}
