/**
 * Indexing Monitor - SEO Agent Component
 *
 * Monitors and submits new articles for Google indexing
 * Ensures articles are indexed within 24 hours of publishing
 */

import { DataFetcher } from '@/lib/data-fetcher';
import { getGoogleIndexingAPI } from '@/lib/google-indexing';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface IndexingMonitorResult {
  articlesFound: number;
  articlesSubmitted: number;
  errors: string[];
}

export class IndexingMonitor {
  private indexingAPI = getGoogleIndexingAPI();

  /**
   * Find and submit articles published in the last 24 hours
   */
  async monitorAndSubmit(): Promise<IndexingMonitorResult> {
    const result: IndexingMonitorResult = {
      articlesFound: 0,
      articlesSubmitted: 0,
      errors: []
    };

    try {
      console.log('🔍 IndexingMonitor: Checking for new articles...');

      // Fetch articles from last 24 hours
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);

      const articles = await DataFetcher.fetchPosts({
        per_page: '50',
        after: oneDayAgo.toISOString(),
        orderby: 'date',
        order: 'desc'
      });

      result.articlesFound = articles.length;
      console.log(`📄 Found ${articles.length} articles from last 24 hours`);

      if (articles.length === 0) {
        return result;
      }

      // Check which articles haven't been submitted yet
      const { data: alreadySubmitted } = await supabase
        .from('seo_indexing_status')
        .select('url')
        .in('url', articles.map(a => a.link));

      const submittedUrls = new Set(alreadySubmitted?.map(s => s.url) || []);

      // Filter to only unsubmitted articles
      const articlesToSubmit = articles.filter(a => !submittedUrls.has(a.link));

      console.log(`📤 Submitting ${articlesToSubmit.length} new articles...`);

      // Submit articles in batches (respecting rate limits)
      for (const article of articlesToSubmit) {
        try {
          // Extract category from link (e.g., /afrique/article-slug -> afrique)
          const urlParts = article.link.replace('https://www.afriquesports.net/', '').split('/');
          const category = urlParts[0];
          const slug = article.slug;

          // Submit to Google Indexing API (all locales)
          const success = await this.indexingAPI.notifyArticleAllLocales(category, slug);

          if (success) {
            result.articlesSubmitted++;
            console.log(`✅ Submitted: ${category}/${slug}`);
          } else {
            result.errors.push(`Failed to submit: ${category}/${slug}`);
          }

          // Rate limiting: 200 requests/min = ~300ms per article
          await new Promise(resolve => setTimeout(resolve, 300));

        } catch (error: any) {
          const errorMsg = `Error submitting ${article.slug}: ${error.message}`;
          result.errors.push(errorMsg);
          console.error(`❌ ${errorMsg}`);
        }
      }

      console.log(`✅ IndexingMonitor: Submitted ${result.articlesSubmitted}/${articlesToSubmit.length} articles`);

      return result;
    } catch (error: any) {
      const errorMsg = `Fatal error in IndexingMonitor: ${error.message}`;
      result.errors.push(errorMsg);
      console.error(`❌ ${errorMsg}`);
      return result;
    }
  }

  /**
   * Check indexing status of submitted URLs
   * Updates database with latest status from Google
   */
  async checkIndexingStatus(): Promise<number> {
    try {
      // Get URLs submitted in last 7 days that haven't been checked recently
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: pendingUrls } = await supabase
        .from('seo_indexing_status')
        .select('url')
        .gte('submitted_at', sevenDaysAgo.toISOString())
        .or('indexing_status.eq.submitted,indexing_status.eq.error')
        .limit(50);

      if (!pendingUrls || pendingUrls.length === 0) {
        console.log('No pending URLs to check');
        return 0;
      }

      console.log(`Checking indexing status for ${pendingUrls.length} URLs...`);

      let updatedCount = 0;

      for (const { url } of pendingUrls) {
        try {
          // Get metadata from Google Indexing API
          const metadata = await this.indexingAPI.getMetadata(url);

          if (metadata) {
            // Update status based on metadata
            await supabase
              .from('seo_indexing_status')
              .update({
                indexing_status: 'indexed',
                last_checked_at: new Date().toISOString(),
                error_message: null
              })
              .eq('url', url);

            updatedCount++;
          }

          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 300));

        } catch (error: any) {
          console.error(`Error checking ${url}:`, error.message);
        }
      }

      console.log(`✅ Updated status for ${updatedCount} URLs`);
      return updatedCount;

    } catch (error: any) {
      console.error('Error in checkIndexingStatus:', error.message);
      return 0;
    }
  }

  /**
   * Get summary statistics for indexing monitor
   */
  async getStats() {
    try {
      const { data: stats } = await supabase
        .from('seo_indexing_status')
        .select('indexing_status')
        .gte('submitted_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      const summary = {
        total: stats?.length || 0,
        submitted: stats?.filter(s => s.indexing_status === 'submitted').length || 0,
        indexed: stats?.filter(s => s.indexing_status === 'indexed').length || 0,
        errors: stats?.filter(s => s.indexing_status === 'error').length || 0,
      };

      return summary;
    } catch (error: any) {
      console.error('Error getting indexing stats:', error.message);
      return null;
    }
  }
}
