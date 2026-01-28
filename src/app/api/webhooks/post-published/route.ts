import { NextResponse } from 'next/server';
import { after } from 'next/server';
import { revalidatePath } from 'next/cache';
import { fetchFrenchPostBySlug, translateToAllLocales } from '@/lib/translate-post';
import { getGoogleIndexingAPI } from '@/lib/google-indexing';
import { getIndexNowAPI } from '@/lib/bing-indexnow';
// Push imports removed - notifications are now manual via /dashboard/push

/**
 * Webhook endpoint called by WordPress when a French article is published.
 *
 * Flow:
 * 1. Validates WEBHOOK_SECRET
 * 2. Returns 202 immediately (processing happens in background)
 * 3. Fetches full French post from WordPress API
 * 4. Translates to EN, ES, AR in parallel via OpenAI
 * 5. Publishes translations to respective WordPress instances
 * 6. Submits all locale URLs to Google Indexing API
 * 7. Submits all locale URLs to IndexNow (Bing, Yandex)
 * 8. Revalidates Next.js cache for all locales
 *
 * Usage:
 * POST /api/webhooks/post-published
 * Header: x-webhook-secret: <WEBHOOK_SECRET>
 * Body: { "slug": "article-slug", "category": "football", "action": "publish" }
 */
export async function POST(request: Request) {
  try {
    // Validate webhook secret
    const secret = request.headers.get('x-webhook-secret');
    const expectedSecret = process.env.WEBHOOK_SECRET;
    if (!expectedSecret || secret !== expectedSecret) {
      console.error('[post-published] Invalid webhook secret');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { slug, category, action } = body;

    // Validate required fields
    if (!slug) {
      return NextResponse.json(
        { error: 'Missing required field: slug' },
        { status: 400 }
      );
    }

    if (action && action !== 'publish') {
      return NextResponse.json(
        { message: `Ignored action: ${action}` },
        { status: 200 }
      );
    }

    console.log(`[post-published] Webhook received: slug="${slug}" category="${category}"`);

    // Process translations and indexing in the background
    after(async () => {
      const startTime = Date.now();
      console.log(`[post-published] Background processing started for "${slug}"`);

      try {
        // 1. Fetch the full French post
        const frenchPost = await fetchFrenchPostBySlug(slug);
        if (!frenchPost) {
          console.error(`[post-published] French post not found: "${slug}"`);
          return;
        }
        console.log(`[post-published] Fetched French post: "${slug}" (ID: ${frenchPost.id})`);

        // 2. Translate to all locales (EN, ES, AR) in parallel
        const translationResults = await translateToAllLocales(frenchPost);
        const successCount = translationResults.filter(r => r.success).length;
        const failedResults = translationResults.filter(r => !r.success && r.error !== 'already_exists');
        console.log(`[post-published] Translations: ${successCount}/3 succeeded`);
        for (const failed of failedResults) {
          console.error(`[post-published] Translation failed for ${failed.locale}: ${failed.error}`);
        }

        // 3. Resolve category slug for Google Indexing
        // Use the category from webhook body, or extract from the French post
        let categorySlug = category;
        if (!categorySlug) {
          const frCategories = frenchPost._embedded?.['wp:term']?.[0];
          categorySlug = frCategories?.[0]?.slug || 'football';
        }

        // 4. Submit all locale URLs to Google Indexing API
        try {
          const indexingAPI = getGoogleIndexingAPI();
          const indexingSuccess = await indexingAPI.notifyArticleAllLocales(categorySlug, slug);
          console.log(`[post-published] Google Indexing: ${indexingSuccess ? 'success' : 'partial/failed'}`);
        } catch (indexErr: any) {
          console.error(`[post-published] Google Indexing error: ${indexErr.message}`);
        }

        // 5. Submit all locale URLs to IndexNow (Bing, Yandex)
        try {
          const indexNow = getIndexNowAPI();
          const indexNowSuccess = await indexNow.notifyArticleAllLocales(categorySlug, slug);
          console.log(`[post-published] IndexNow (Bing): ${indexNowSuccess ? 'success' : 'failed'}`);
        } catch (indexNowErr: any) {
          console.error(`[post-published] IndexNow error: ${indexNowErr.message}`);
        }

        // 6. Revalidate Next.js cache for all locales
        const locales = ['fr', 'en', 'es', 'ar'];
        for (const locale of locales) {
          try {
            revalidatePath(`/${locale}/${categorySlug}/${slug}`);
            revalidatePath(`/${locale}/${categorySlug}`);
            revalidatePath(`/${locale}`);
          } catch (revalErr: any) {
            console.error(`[post-published] Revalidation error for ${locale}: ${revalErr.message}`);
          }
        }
        // Also revalidate the root (French homepage)
        revalidatePath('/');

        // 7. Push notifications disabled - use dashboard to send manually
        // Push notifications can be sent from /dashboard/push

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`[post-published] Background processing completed for "${slug}" in ${elapsed}s`);
        console.log(`[post-published] Results:`, JSON.stringify(translationResults, null, 2));
      } catch (err: any) {
        console.error(`[post-published] Background processing failed for "${slug}": ${err.message}`);
      }
    });

    // Return immediately while processing continues in the background
    return NextResponse.json(
      {
        accepted: true,
        slug,
        category,
        message: 'Translation and indexing started in background',
        timestamp: new Date().toISOString(),
      },
      { status: 202 }
    );
  } catch (error: any) {
    console.error('[post-published] Webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * Health check
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: 'post-published',
    message: 'Webhook endpoint is ready',
  });
}
