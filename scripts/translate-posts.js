#!/usr/bin/env node

/**
 * Translate French posts to English, Spanish, or Arabic
 *
 * Fetches today's published French posts, translates title/excerpt/content
 * using OpenAI GPT, and publishes them to the target locale WordPress.
 * All WordPress URLs are read from environment variables in .env.local
 *
 * Usage:
 *   node scripts/translate-posts.js [--locale=en|es|ar] [--dry-run] [--limit=5] [--days=1]
 *
 * Options:
 *   --locale=en    Target language (default: en)
 *   --dry-run      Show what would be translated without publishing
 *   --limit=N      Max posts to translate (default: all)
 *   --days=N       Fetch posts from last N days (default: 1 = today)
 */

require('dotenv').config({ path: '.env.local' });

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const WP_USERNAME = process.env.WP_USERNAME || 'admin';
const WP_APP_PASSWORD = process.env.WP_APP_PASSWORD || '';
const FR_API_URL = process.env.WP_FR_API_URL;

if (!OPENAI_API_KEY) {
  console.error('ERROR: OPENAI_API_KEY not set in .env.local');
  process.exit(1);
}
if (!FR_API_URL) {
  console.error('ERROR: WP_FR_API_URL not set in .env.local');
  process.exit(1);
}

const LOCALE_CONFIG = {
  en: {
    envKey: 'WP_EN_API_URL',
    label: 'English',
    systemPrompt: `You are an African sports journalist writing for an English-speaking audience. Translate French sports articles to natural, engaging English.

Style guidelines:
- Write like a real African football journalist, not a robot. Be direct, passionate, and conversational
- Use short, punchy sentences. Vary sentence length for rhythm
- NEVER use em dashes (—). Use commas, periods, or "and" instead
- Avoid overusing colons and semicolons. Prefer simple sentence structures
- Don't over-explain or add filler words like "indeed", "notably", "furthermore", "moreover"
- Keep the energy and emotion of African football coverage. Use strong verbs
- When the French uses informal/spoken tone, keep that feel in English

Translation rules:
- Keep proper nouns (player names, team names, city names) unchanged
- Preserve HTML formatting tags exactly as they are (<p>, <strong>, <em>, <h2>, <h3>, <blockquote>, <ul>, <li>, <a href="...">)
- Do NOT translate URLs or href attributes
- Keep sports-specific terms accurate (e.g., "mercato" → "transfer window", "ballon d'or" → "Ballon d'Or")
- Adapt French football terms: "buteur" → "scorer", "passeur" → "assist provider", "gardien" → "goalkeeper"
- Return ONLY the translated text, no explanations`,
  },
  es: {
    envKey: 'WP_ES_API_URL',
    label: 'Spanish',
    systemPrompt: `You are an African sports journalist writing for a Spanish-speaking audience. Translate French sports articles to natural, engaging Spanish.

Style guidelines:
- Write like a real African football journalist, not a robot. Be direct, passionate, and conversational
- Use short, punchy sentences. Vary sentence length for rhythm
- NEVER use em dashes (—). Use commas, periods, or "y" instead
- Avoid overusing colons and semicolons. Prefer simple sentence structures
- Don't over-explain or add filler words like "ciertamente", "notablemente", "además"
- Keep the energy and emotion of African football coverage. Use strong verbs
- When the French uses informal/spoken tone, keep that feel in Spanish

Translation rules:
- Keep proper nouns (player names, team names, city names) unchanged
- Preserve HTML formatting tags exactly as they are (<p>, <strong>, <em>, <h2>, <h3>, <blockquote>, <ul>, <li>, <a href="...">)
- Do NOT translate URLs or href attributes
- Keep sports-specific terms accurate (e.g., "mercato" → "mercado de fichajes", "ballon d'or" → "Balón de Oro")
- Return ONLY the translated text, no explanations`,
  },
  ar: {
    envKey: 'WP_AR_API_URL',
    label: 'Arabic',
    systemPrompt: `You are an African sports journalist writing for an Arabic-speaking audience. Translate French sports articles to natural, engaging Modern Standard Arabic (فصحى) that is accessible to all Arab readers.

Style guidelines:
- Write like a real African football journalist, not a robot. Be direct, passionate, and conversational
- Use short, punchy sentences. Vary sentence length for rhythm
- NEVER use em dashes (—). Use commas or periods instead
- Avoid overly formal or literary Arabic. Keep it accessible journalism
- Don't over-explain or add filler words
- Keep the energy and emotion of African football coverage. Use strong verbs
- When the French uses informal/spoken tone, use accessible MSA (not dialectal)

Translation rules:
- Keep proper nouns (player names, team names, city names) unchanged
- Preserve HTML formatting tags exactly as they are (<p>, <strong>, <em>, <h2>, <h3>, <blockquote>, <ul>, <li>, <a href="...">)
- Do NOT translate URLs or href attributes
- Keep sports-specific terms accurate (e.g., "mercato" → "سوق الانتقالات", "ballon d'or" → "الكرة الذهبية")
- Adapt French football terms: "buteur" → "هداف", "passeur" → "صانع ألعاب", "gardien" → "حارس مرمى"
- Return ONLY the translated text, no explanations`,
  },
};

// Parse CLI args
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const localeArg = args.find(a => a.startsWith('--locale='));
const limitArg = args.find(a => a.startsWith('--limit='));
const daysArg = args.find(a => a.startsWith('--days='));
const targetLocale = localeArg ? localeArg.split('=')[1] : 'en';
const limit = limitArg ? parseInt(limitArg.split('=')[1]) : 0;
const days = daysArg ? parseInt(daysArg.split('=')[1]) : 1;

if (!LOCALE_CONFIG[targetLocale]) {
  console.error(`Invalid locale: ${targetLocale}. Use: en, es, ar`);
  process.exit(1);
}

const config = LOCALE_CONFIG[targetLocale];
const TARGET_API_URL = process.env[config.envKey];

if (!TARGET_API_URL) {
  console.error(`ERROR: ${config.envKey} not set in .env.local`);
  process.exit(1);
}

const AUTH_HEADER = 'Basic ' + Buffer.from(`${WP_USERNAME}:${WP_APP_PASSWORD}`).toString('base64');

// ============================================================================
// WordPress API helpers
// ============================================================================

async function wpFetch(baseUrl, endpoint, options = {}) {
  const url = `${baseUrl}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': AUTH_HEADER,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`WP API ${response.status}: ${text.substring(0, 300)}`);
  }

  return {
    data: await response.json(),
    totalPages: parseInt(response.headers.get('x-wp-totalpages') || '1'),
    total: parseInt(response.headers.get('x-wp-total') || '0'),
  };
}

async function fetchTodaysFrenchPosts() {
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  const afterISO = startDate.toISOString();
  const allPosts = [];
  let page = 1;
  let totalPages = 1;

  console.log(`\nFetching French posts since ${afterISO}...`);

  while (page <= totalPages) {
    const { data, totalPages: tp, total } = await wpFetch(
      FR_API_URL,
      `/posts?per_page=100&page=${page}&after=${afterISO}&orderby=date&order=desc&_embed=true`
    );

    if (page === 1) {
      totalPages = tp;
      console.log(`  Found ${total} posts (${totalPages} pages)`);
    }

    allPosts.push(...data);
    console.log(`  Page ${page}/${totalPages} - ${data.length} posts`);
    page++;
  }

  return allPosts;
}

async function fetchExistingTargetSlugs() {
  const slugs = new Set();
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    try {
      const { data, totalPages: tp } = await wpFetch(
        TARGET_API_URL,
        `/posts?per_page=100&page=${page}&status=any&_fields=id,slug`
      );

      if (page === 1) totalPages = tp;
      for (const post of data) slugs.add(post.slug);
      page++;
    } catch (e) {
      // If target site is empty or has issues, return empty set
      break;
    }
  }

  return slugs;
}

async function getOrCreateCategory(frCategoryName, frCategorySlug) {
  try {
    const { data } = await wpFetch(TARGET_API_URL, `/categories?slug=${frCategorySlug}`);
    if (data.length > 0) return data[0].id;
  } catch (e) {
    // Category doesn't exist
  }

  try {
    const { data } = await wpFetch(TARGET_API_URL, '/categories', {
      method: 'POST',
      body: JSON.stringify({
        name: frCategoryName,
        slug: frCategorySlug,
      }),
    });
    console.log(`    Created category: ${frCategoryName} (${data.id})`);
    return data.id;
  } catch (e) {
    console.warn(`    Could not create category ${frCategoryName}: ${e.message}`);
    return null;
  }
}

async function publishTranslatedPost(translatedPost) {
  const { data } = await wpFetch(TARGET_API_URL, '/posts', {
    method: 'POST',
    body: JSON.stringify(translatedPost),
  });
  return data;
}

// ============================================================================
// OpenAI translation
// ============================================================================

async function translateText(text, context = 'article content') {
  if (!text || text.trim().length === 0) return '';

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [
        { role: 'system', content: config.systemPrompt },
        { role: 'user', content: `Translate this ${context} from French to ${config.label}:\n\n${text}` },
      ],
      temperature: 0.3,
      max_tokens: 4000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error ${response.status}: ${error.substring(0, 200)}`);
  }

  const result = await response.json();
  return result.choices[0]?.message?.content?.trim() || '';
}

async function translatePost(frPost) {
  const title = frPost.title?.rendered || '';
  const excerpt = frPost.excerpt?.rendered || '';
  const content = frPost.content?.rendered || '';

  console.log(`    Translating title...`);
  const translatedTitle = await translateText(decodeHtmlEntities(title), 'article title');

  console.log(`    Translating excerpt...`);
  const translatedExcerpt = await translateText(excerpt, 'article excerpt');

  console.log(`    Translating content (${content.length} chars)...`);
  const translatedContent = await translateLongContent(content);

  return { translatedTitle, translatedExcerpt, translatedContent };
}

async function translateLongContent(htmlContent) {
  const MAX_CHUNK_SIZE = 6000;

  if (htmlContent.length <= MAX_CHUNK_SIZE) {
    return translateText(htmlContent, 'article body');
  }

  const paragraphs = htmlContent.split(/(<\/p>)/i);
  const chunks = [];
  let currentChunk = '';

  for (const part of paragraphs) {
    if ((currentChunk + part).length > MAX_CHUNK_SIZE && currentChunk.length > 0) {
      chunks.push(currentChunk);
      currentChunk = part;
    } else {
      currentChunk += part;
    }
  }
  if (currentChunk) chunks.push(currentChunk);

  console.log(`    Content split into ${chunks.length} chunks`);
  const translatedChunks = [];
  for (let i = 0; i < chunks.length; i++) {
    console.log(`    Translating chunk ${i + 1}/${chunks.length}...`);
    const translated = await translateText(chunks[i], `article body (part ${i + 1})`);
    translatedChunks.push(translated);
    if (i < chunks.length - 1) await new Promise(r => setTimeout(r, 500));
  }

  return translatedChunks.join('');
}

function decodeHtmlEntities(text) {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&rdquo;/g, '"')
    .replace(/&ldquo;/g, '"')
    .replace(/&hellip;/g, '...')
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—')
    .replace(/&nbsp;/g, ' ');
}

// ============================================================================
// Featured image handling
// ============================================================================

async function setFeaturedImageFromUrl(postId, imageUrl, altText) {
  console.log(`    Uploading featured image...`);

  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) throw new Error(`Failed to download image: ${imageResponse.status}`);

  const imageBuffer = await imageResponse.arrayBuffer();
  const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
  const ext = contentType.includes('png') ? '.png' : contentType.includes('webp') ? '.webp' : '.jpg';
  const filename = `featured-${postId}${ext}`;

  const uploadResponse = await fetch(`${TARGET_API_URL}/media`, {
    method: 'POST',
    headers: {
      'Authorization': AUTH_HEADER,
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
    body: Buffer.from(imageBuffer),
  });

  if (!uploadResponse.ok) {
    const text = await uploadResponse.text();
    throw new Error(`Media upload failed: ${uploadResponse.status} - ${text.substring(0, 200)}`);
  }

  const media = await uploadResponse.json();

  await wpFetch(TARGET_API_URL, `/posts/${postId}`, {
    method: 'POST',
    body: JSON.stringify({ featured_media: media.id }),
  });

  console.log(`    Featured image set (media ID: ${media.id})`);
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  console.log('='.repeat(60));
  console.log(`  Translate French Posts -> ${config.label}`);
  console.log(`  Source: ${FR_API_URL}`);
  console.log(`  Target: ${TARGET_API_URL}`);
  console.log(`  Model: ${OPENAI_MODEL}`);
  console.log(`  Days: ${days}`);
  if (limit) console.log(`  Limit: ${limit} posts`);
  if (dryRun) console.log('  MODE: DRY RUN');
  console.log('='.repeat(60));

  try {
    // 1. Fetch today's French posts
    const frPosts = await fetchTodaysFrenchPosts();
    if (frPosts.length === 0) {
      console.log('\nNo French posts found for the specified period.');
      return;
    }

    // 2. Check existing translated posts to avoid duplicates
    console.log('\nChecking existing translated posts...');
    const existingSlugs = await fetchExistingTargetSlugs();
    console.log(`  ${existingSlugs.size} posts already on ${config.label} site`);

    // 3. Filter new posts
    const postsToTranslate = frPosts.filter(p => !existingSlugs.has(p.slug));
    console.log(`  ${postsToTranslate.length} new posts to translate`);

    const batch = limit > 0 ? postsToTranslate.slice(0, limit) : postsToTranslate;

    if (batch.length === 0) {
      console.log('\nAll posts already translated. Nothing to do.');
      return;
    }

    console.log(`\nTranslating ${batch.length} posts...`);
    let translated = 0;
    let failed = 0;

    for (const frPost of batch) {
      const postTitle = decodeHtmlEntities(frPost.title?.rendered || 'Untitled');
      console.log(`\n  [${translated + 1}/${batch.length}] ${postTitle}`);

      try {
        const { translatedTitle, translatedExcerpt, translatedContent } = await translatePost(frPost);

        if (dryRun) {
          console.log(`    -> ${translatedTitle}`);
          console.log(`    (DRY RUN - not published)`);
          translated++;
          continue;
        }

        // Resolve categories
        const categoryIds = [];
        const frCategories = frPost._embedded?.['wp:term']?.[0] || [];
        for (const cat of frCategories) {
          const catId = await getOrCreateCategory(cat.name, cat.slug);
          if (catId) categoryIds.push(catId);
        }

        // Build post payload
        const postPayload = {
          title: translatedTitle,
          content: translatedContent,
          excerpt: translatedExcerpt,
          slug: frPost.slug,
          status: 'publish',
          date: frPost.date,
          categories: categoryIds.length > 0 ? categoryIds : undefined,
          featured_media: 0,
        };

        const featuredImageUrl = frPost.jetpack_featured_media_url
          || frPost._embedded?.['wp:featuredmedia']?.[0]?.source_url;

        // Publish
        console.log(`    Publishing to ${config.label} WordPress...`);
        const published = await publishTranslatedPost(postPayload);
        console.log(`    Published! ID: ${published.id}`);

        // Set featured image
        if (featuredImageUrl) {
          try {
            await setFeaturedImageFromUrl(published.id, featuredImageUrl, translatedTitle);
          } catch (imgErr) {
            console.warn(`    Could not set featured image: ${imgErr.message}`);
          }
        }

        translated++;
      } catch (err) {
        failed++;
        console.error(`    ERROR: ${err.message}`);
      }

      await new Promise(r => setTimeout(r, 1000));
    }

    console.log('\n' + '='.repeat(60));
    console.log(`  TRANSLATION COMPLETE`);
    console.log(`  Translated: ${translated}`);
    console.log(`  Failed: ${failed}`);
    console.log(`  Skipped (already exist): ${frPosts.length - batch.length}`);
    console.log('='.repeat(60));
  } catch (err) {
    console.error('\nFATAL ERROR:', err.message);
    process.exit(1);
  }
}

main();
