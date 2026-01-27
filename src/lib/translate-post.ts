/**
 * Server-side translation module for auto-translating French posts to EN/ES/AR
 *
 * Extracted from scripts/translate-posts.js for use in API routes.
 * Uses OpenAI GPT to translate WordPress posts and publishes them
 * to the target locale WordPress instances.
 */

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const WP_USERNAME = process.env.WP_USERNAME || 'admin';
const WP_APP_PASSWORD = process.env.WP_APP_PASSWORD || '';
const FR_API_URL = process.env.WP_FR_API_URL || '';

const AUTH_HEADER = 'Basic ' + Buffer.from(`${WP_USERNAME}:${WP_APP_PASSWORD}`).toString('base64');

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WordPressPostEmbed {
  id: number;
  date: string;
  slug: string;
  title: { rendered: string };
  excerpt: { rendered: string };
  content: { rendered: string };
  categories: number[];
  jetpack_featured_media_url?: string;
  _embedded?: {
    'wp:featuredmedia'?: Array<{ source_url: string }>;
    'wp:term'?: Array<Array<{ id: number; name: string; slug: string }>>;
  };
}

export type SupportedLocale = 'en' | 'es' | 'ar';

interface LocaleConfig {
  envKey: string;
  label: string;
  systemPrompt: string;
}

interface TranslationResult {
  locale: SupportedLocale;
  success: boolean;
  postId?: number;
  postUrl?: string;
  error?: string;
}

// ---------------------------------------------------------------------------
// Locale configuration with system prompts
// ---------------------------------------------------------------------------

const LOCALE_CONFIG: Record<SupportedLocale, LocaleConfig> = {
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

// ---------------------------------------------------------------------------
// HTML entity decoder
// ---------------------------------------------------------------------------

function decodeHtmlEntities(text: string): string {
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

// ---------------------------------------------------------------------------
// WordPress API helpers
// ---------------------------------------------------------------------------

async function wpFetch(baseUrl: string, endpoint: string, options: RequestInit = {}) {
  const url = `${baseUrl}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': AUTH_HEADER,
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
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

async function getOrCreateCategory(
  targetApiUrl: string,
  frCategoryName: string,
  frCategorySlug: string
): Promise<number | null> {
  // Try to find existing category
  try {
    const { data } = await wpFetch(targetApiUrl, `/categories?slug=${frCategorySlug}`);
    if (data.length > 0) return data[0].id;
  } catch {
    // Category doesn't exist, create it
  }

  try {
    const { data } = await wpFetch(targetApiUrl, '/categories', {
      method: 'POST',
      body: JSON.stringify({ name: frCategoryName, slug: frCategorySlug }),
    });
    console.log(`[translate] Created category: ${frCategoryName} (${data.id})`);
    return data.id;
  } catch (e: any) {
    console.warn(`[translate] Could not create category ${frCategoryName}: ${e.message}`);
    return null;
  }
}

async function checkSlugExists(targetApiUrl: string, slug: string): Promise<boolean> {
  try {
    const { data } = await wpFetch(
      targetApiUrl,
      `/posts?slug=${slug}&status=any&_fields=id,slug`
    );
    return data.length > 0;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// OpenAI translation
// ---------------------------------------------------------------------------

/**
 * Translate a text string using OpenAI
 */
export async function translateText(
  text: string,
  context: string,
  locale: SupportedLocale
): Promise<string> {
  if (!text || text.trim().length === 0) return '';

  const config = LOCALE_CONFIG[locale];

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

/**
 * Translate long HTML content by splitting into chunks at paragraph boundaries
 */
export async function translateLongContent(
  htmlContent: string,
  locale: SupportedLocale
): Promise<string> {
  const MAX_CHUNK_SIZE = 6000;

  if (htmlContent.length <= MAX_CHUNK_SIZE) {
    return translateText(htmlContent, 'article body', locale);
  }

  // Split at </p> tags to preserve HTML structure
  const paragraphs = htmlContent.split(/(<\/p>)/i);
  const chunks: string[] = [];
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

  console.log(`[translate] Content split into ${chunks.length} chunks for ${locale}`);
  const translatedChunks: string[] = [];

  for (let i = 0; i < chunks.length; i++) {
    console.log(`[translate] Translating chunk ${i + 1}/${chunks.length} for ${locale}...`);
    const translated = await translateText(chunks[i], `article body (part ${i + 1})`, locale);
    translatedChunks.push(translated);
    // Small delay between chunks to avoid rate limiting
    if (i < chunks.length - 1) {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  return translatedChunks.join('');
}

// ---------------------------------------------------------------------------
// Featured image upload
// ---------------------------------------------------------------------------

async function uploadFeaturedImage(
  targetApiUrl: string,
  postId: number,
  imageUrl: string,
  altText: string
): Promise<void> {
  console.log(`[translate] Uploading featured image for post ${postId}...`);

  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) {
    throw new Error(`Failed to download image: ${imageResponse.status}`);
  }

  const imageBuffer = await imageResponse.arrayBuffer();
  const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
  const ext = contentType.includes('png') ? '.png' : contentType.includes('webp') ? '.webp' : '.jpg';
  const filename = `featured-${postId}${ext}`;

  const uploadResponse = await fetch(`${targetApiUrl}/media`, {
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

  // Attach to post
  await wpFetch(targetApiUrl, `/posts/${postId}`, {
    method: 'POST',
    body: JSON.stringify({ featured_media: media.id }),
  });

  console.log(`[translate] Featured image set for post ${postId} (media ID: ${media.id})`);
}

// ---------------------------------------------------------------------------
// Main translation + publish pipeline
// ---------------------------------------------------------------------------

/**
 * Translate a single French post and publish it to the target locale WordPress
 */
export async function translateAndPublishPost(
  frenchPost: WordPressPostEmbed,
  locale: SupportedLocale
): Promise<TranslationResult> {
  const config = LOCALE_CONFIG[locale];
  const targetApiUrl = process.env[config.envKey];

  if (!targetApiUrl) {
    return { locale, success: false, error: `${config.envKey} not configured` };
  }

  const postTitle = decodeHtmlEntities(frenchPost.title?.rendered || 'Untitled');

  try {
    // 1. Check if translation already exists
    const exists = await checkSlugExists(targetApiUrl, frenchPost.slug);
    if (exists) {
      console.log(`[translate] ${config.label}: Post "${frenchPost.slug}" already exists, skipping`);
      return { locale, success: true, error: 'already_exists' };
    }

    // 2. Translate title, excerpt, content
    console.log(`[translate] ${config.label}: Translating "${postTitle}"...`);

    const translatedTitle = await translateText(
      decodeHtmlEntities(frenchPost.title?.rendered || ''),
      'article title',
      locale
    );
    const translatedExcerpt = await translateText(
      frenchPost.excerpt?.rendered || '',
      'article excerpt',
      locale
    );
    const translatedContent = await translateLongContent(
      frenchPost.content?.rendered || '',
      locale
    );

    // 3. Resolve categories
    const categoryIds: number[] = [];
    const frCategories = frenchPost._embedded?.['wp:term']?.[0] || [];
    for (const cat of frCategories) {
      const catId = await getOrCreateCategory(targetApiUrl, cat.name, cat.slug);
      if (catId) categoryIds.push(catId);
    }

    // 4. Build and publish post
    const postPayload = {
      title: translatedTitle,
      content: translatedContent,
      excerpt: translatedExcerpt,
      slug: frenchPost.slug,
      status: 'publish',
      date: frenchPost.date,
      categories: categoryIds.length > 0 ? categoryIds : undefined,
      featured_media: 0,
    };

    console.log(`[translate] ${config.label}: Publishing to WordPress...`);
    const { data: published } = await wpFetch(targetApiUrl, '/posts', {
      method: 'POST',
      body: JSON.stringify(postPayload),
    });
    console.log(`[translate] ${config.label}: Published! ID: ${published.id}`);

    // 5. Upload featured image
    const featuredImageUrl = frenchPost.jetpack_featured_media_url
      || frenchPost._embedded?.['wp:featuredmedia']?.[0]?.source_url;

    if (featuredImageUrl) {
      try {
        await uploadFeaturedImage(targetApiUrl, published.id, featuredImageUrl, translatedTitle);
      } catch (imgErr: any) {
        console.warn(`[translate] ${config.label}: Could not set featured image: ${imgErr.message}`);
      }
    }

    return {
      locale,
      success: true,
      postId: published.id,
      postUrl: published.link,
    };
  } catch (err: any) {
    console.error(`[translate] ${config.label}: Error translating "${postTitle}": ${err.message}`);
    return { locale, success: false, error: err.message };
  }
}

/**
 * Translate a French post to all target locales (EN, ES, AR) in parallel
 */
export async function translateToAllLocales(
  frenchPost: WordPressPostEmbed
): Promise<TranslationResult[]> {
  const locales: SupportedLocale[] = ['en', 'es', 'ar'];

  console.log(`[translate] Starting parallel translation to ${locales.length} locales...`);

  const results = await Promise.allSettled(
    locales.map(locale => translateAndPublishPost(frenchPost, locale))
  );

  return results.map((result, i) => {
    if (result.status === 'fulfilled') {
      return result.value;
    }
    return {
      locale: locales[i],
      success: false,
      error: result.reason?.message || 'Unknown error',
    };
  });
}

/**
 * Fetch a single French post by slug from WordPress
 */
export async function fetchFrenchPostBySlug(slug: string): Promise<WordPressPostEmbed | null> {
  if (!FR_API_URL) {
    console.error('[translate] WP_FR_API_URL not configured');
    return null;
  }

  try {
    const { data } = await wpFetch(
      FR_API_URL,
      `/posts?slug=${slug}&_embed=true&per_page=1`
    );
    return data.length > 0 ? data[0] : null;
  } catch (err: any) {
    console.error(`[translate] Error fetching French post "${slug}": ${err.message}`);
    return null;
  }
}
