/**
 * IndexNow API - Instant URL notification for Bing, Yandex, and other search engines
 *
 * IndexNow is a protocol that allows websites to notify search engines
 * about URL changes instantly. Supported by Bing, Yandex, Seznam, Naver.
 *
 * Setup:
 * 1. The API key file is hosted at /public/{key}.txt
 * 2. No additional credentials needed - key-based auth only
 *
 * Rate limits: up to 10,000 URLs per day
 */

const SITE_HOST = 'www.afriquesports.net';
const SITE_URL = `https://${SITE_HOST}`;
const INDEXNOW_KEY = '7ea234755127e9b4eb635cb20f85950f';
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';

export class IndexNowAPI {
  /**
   * Submit a batch of URLs to IndexNow (Bing, Yandex, etc.)
   */
  async submitUrls(urls: string[]): Promise<boolean> {
    if (urls.length === 0) return true;

    try {
      const response = await fetch(INDEXNOW_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host: SITE_HOST,
          key: INDEXNOW_KEY,
          keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
          urlList: urls,
        }),
      });

      // IndexNow returns 200 (OK), 202 (Accepted), or 204 (No Content) on success
      const success = response.status >= 200 && response.status < 300;

      if (success) {
        console.log(`✅ IndexNow: ${urls.length} URLs submitted (status: ${response.status})`);
      } else {
        const text = await response.text();
        console.error(`❌ IndexNow error ${response.status}: ${text.substring(0, 200)}`);
      }

      return success;
    } catch (error: any) {
      console.error('❌ IndexNow request failed:', error.message);
      return false;
    }
  }

  /**
   * Notify IndexNow about a published article across all locales
   */
  async notifyArticleAllLocales(category: string, slug: string): Promise<boolean> {
    const locales = ['fr', 'en', 'es', 'ar'];
    const urls = locales.map(locale =>
      locale === 'fr'
        ? `${SITE_URL}/${category}/${slug}`
        : `${SITE_URL}/${locale}/${category}/${slug}`
    );

    return this.submitUrls(urls);
  }

  /**
   * Notify IndexNow about a match page across all locales
   */
  async notifyMatchAllLocales(matchId: string): Promise<boolean> {
    const locales = ['fr', 'en', 'es', 'ar'];
    const urls = locales.map(locale =>
      locale === 'fr'
        ? `${SITE_URL}/can-2025/match/${matchId}`
        : `${SITE_URL}/${locale}/can-2025/match/${matchId}`
    );

    return this.submitUrls(urls);
  }
}

// Singleton
let indexNowAPI: IndexNowAPI | null = null;

export function getIndexNowAPI(): IndexNowAPI {
  if (!indexNowAPI) {
    indexNowAPI = new IndexNowAPI();
  }
  return indexNowAPI;
}
