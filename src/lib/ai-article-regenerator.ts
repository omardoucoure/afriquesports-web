/**
 * AI Article Regenerator
 *
 * Regenerates placeholder articles in WordPress using AI
 * Uses local Ollama model for fast, free generation
 *
 * Target: 45,298 placeholder articles with content:
 * "Cet article fait partie de nos archives et sera mis à jour prochainement."
 */

import { getPool } from './mysql-db';

export interface PlaceholderArticle {
  ID: number;
  post_title: string;
  post_name: string; // slug
  post_date: string;
  category_name?: string;
}

export interface GenerationResult {
  success: boolean;
  articleId: number;
  title: string;
  error?: string;
}

// Placeholder pattern to identify articles needing regeneration
const PLACEHOLDER_PATTERN = 'Cet article fait partie de nos archives';

/**
 * Get count of placeholder articles
 */
export async function getPlaceholderCount(): Promise<number> {
  const pool = getPool();
  if (!pool) return 0;

  try {
    const [rows] = await pool.execute<any[]>(`
      SELECT COUNT(*) as count
      FROM wp_8_posts
      WHERE post_type = 'post'
      AND post_status = 'publish'
      AND post_content LIKE ?
    `, [`%${PLACEHOLDER_PATTERN}%`]);

    return rows[0]?.count || 0;
  } catch (error) {
    console.error('[AI Regenerator] Error getting placeholder count:', error);
    return 0;
  }
}

/**
 * Get placeholder articles for regeneration
 * Prioritizes by post date (newest first) for SEO value
 */
export async function getPlaceholderArticles(
  limit: number = 50,
  offset: number = 0
): Promise<PlaceholderArticle[]> {
  const pool = getPool();
  if (!pool) return [];

  try {
    const [rows] = await pool.execute<any[]>(`
      SELECT
        p.ID,
        p.post_title,
        p.post_name,
        p.post_date,
        t.name as category_name
      FROM wp_8_posts p
      LEFT JOIN wp_8_term_relationships tr ON p.ID = tr.object_id
      LEFT JOIN wp_8_term_taxonomy tt ON tr.term_taxonomy_id = tt.term_taxonomy_id AND tt.taxonomy = 'category'
      LEFT JOIN wp_8_terms t ON tt.term_id = t.term_id
      WHERE p.post_type = 'post'
      AND p.post_status = 'publish'
      AND p.post_content LIKE ?
      GROUP BY p.ID
      ORDER BY p.post_date DESC
      LIMIT ? OFFSET ?
    `, [`%${PLACEHOLDER_PATTERN}%`, limit, offset]);

    return rows as PlaceholderArticle[];
  } catch (error) {
    console.error('[AI Regenerator] Error getting placeholder articles:', error);
    return [];
  }
}

/**
 * Generate article content using Ollama
 */
export async function generateContent(
  title: string,
  category: string = 'football'
): Promise<{ content: string; excerpt: string } | null> {
  const ollamaUrl = process.env.OLLAMA_URL || 'http://imac.local:11434';
  const model = process.env.OLLAMA_MODEL || 'qwen2.5:14b';

  const systemPrompt = `Tu es un journaliste sportif professionnel pour Afrique Sports.
Écris des articles factuels et engageants sur le football africain et international.
Utilise un style journalistique professionnel en français.
Structure tes articles avec des paragraphes clairs.
N'invente pas de citations fictives.
Concentre-toi sur les faits connus liés au sujet.`;

  const userPrompt = `Écris un article de football basé sur ce titre: "${title}"
Catégorie: ${category}

IMPORTANT: Retourne UNIQUEMENT un JSON valide (sans texte avant ou après):
{"content": "<p>Paragraphe 1...</p><p>Paragraphe 2...</p><p>Paragraphe 3...</p>", "excerpt": "Résumé en 1-2 phrases"}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

    const response = await fetch(`${ollamaUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        prompt: `${systemPrompt}\n\n${userPrompt}`,
        stream: false,
        options: {
          temperature: 0.7,
          num_predict: 1500,
        }
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.status}`);
    }

    const result = await response.json();
    const text = result.response;

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('[AI Regenerator] No JSON found in response for:', title);
      return null;
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate content
    if (!parsed.content || parsed.content.length < 100) {
      console.error('[AI Regenerator] Content too short for:', title);
      return null;
    }

    return {
      content: parsed.content,
      excerpt: parsed.excerpt || parsed.content.substring(0, 150),
    };

  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.error('[AI Regenerator] Timeout generating content for:', title);
    } else {
      console.error('[AI Regenerator] Error generating content:', error.message);
    }
    return null;
  }
}

/**
 * Update article content in WordPress database
 */
export async function updateArticleContent(
  articleId: number,
  content: string,
  excerpt: string
): Promise<boolean> {
  const pool = getPool();
  if (!pool) return false;

  try {
    await pool.execute(`
      UPDATE wp_8_posts
      SET
        post_content = ?,
        post_excerpt = ?,
        post_modified = NOW(),
        post_modified_gmt = UTC_TIMESTAMP()
      WHERE ID = ?
    `, [content, excerpt, articleId]);

    return true;
  } catch (error) {
    console.error('[AI Regenerator] Error updating article:', error);
    return false;
  }
}

/**
 * Regenerate a single article
 */
export async function regenerateArticle(article: PlaceholderArticle): Promise<GenerationResult> {
  console.log(`[AI Regenerator] Generating: ${article.post_title.substring(0, 50)}...`);

  const generated = await generateContent(
    article.post_title,
    article.category_name || 'football'
  );

  if (!generated) {
    return {
      success: false,
      articleId: article.ID,
      title: article.post_title,
      error: 'Failed to generate content'
    };
  }

  const updated = await updateArticleContent(
    article.ID,
    generated.content,
    generated.excerpt
  );

  return {
    success: updated,
    articleId: article.ID,
    title: article.post_title,
    error: updated ? undefined : 'Failed to update database'
  };
}

/**
 * Batch regenerate articles
 * @param batchSize - Number of articles per batch
 * @param delayMs - Delay between articles (to not overload Ollama)
 */
export async function batchRegenerate(
  batchSize: number = 10,
  delayMs: number = 2000,
  onProgress?: (progress: { current: number; total: number; success: number; failed: number }) => void
): Promise<{ success: number; failed: number; total: number }> {
  const articles = await getPlaceholderArticles(batchSize);

  let success = 0;
  let failed = 0;

  for (let i = 0; i < articles.length; i++) {
    const result = await regenerateArticle(articles[i]);

    if (result.success) {
      success++;
      console.log(`[AI Regenerator] ✅ ${i + 1}/${articles.length}: ${result.title.substring(0, 40)}...`);
    } else {
      failed++;
      console.log(`[AI Regenerator] ❌ ${i + 1}/${articles.length}: ${result.error}`);
    }

    if (onProgress) {
      onProgress({ current: i + 1, total: articles.length, success, failed });
    }

    // Delay between articles
    if (i < articles.length - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  return { success, failed, total: articles.length };
}

/**
 * Get regeneration statistics
 */
export async function getRegenerationStats(): Promise<{
  totalPlaceholder: number;
  totalPublished: number;
  recentlyGenerated: number;
}> {
  const pool = getPool();
  if (!pool) {
    return { totalPlaceholder: 0, totalPublished: 0, recentlyGenerated: 0 };
  }

  try {
    const [placeholderRows] = await pool.execute<any[]>(`
      SELECT COUNT(*) as count
      FROM wp_8_posts
      WHERE post_type = 'post'
      AND post_status = 'publish'
      AND post_content LIKE ?
    `, [`%${PLACEHOLDER_PATTERN}%`]);

    const [totalRows] = await pool.execute<any[]>(`
      SELECT COUNT(*) as count
      FROM wp_8_posts
      WHERE post_type = 'post'
      AND post_status = 'publish'
    `);

    const [recentRows] = await pool.execute<any[]>(`
      SELECT COUNT(*) as count
      FROM wp_8_posts
      WHERE post_type = 'post'
      AND post_status = 'publish'
      AND post_modified > DATE_SUB(NOW(), INTERVAL 24 HOUR)
      AND post_content NOT LIKE ?
      AND LENGTH(post_content) > 500
    `, [`%${PLACEHOLDER_PATTERN}%`]);

    return {
      totalPlaceholder: placeholderRows[0]?.count || 0,
      totalPublished: totalRows[0]?.count || 0,
      recentlyGenerated: recentRows[0]?.count || 0,
    };
  } catch (error) {
    console.error('[AI Regenerator] Error getting stats:', error);
    return { totalPlaceholder: 0, totalPublished: 0, recentlyGenerated: 0 };
  }
}
