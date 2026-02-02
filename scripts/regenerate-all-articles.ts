#!/usr/bin/env npx ts-node
/**
 * AI Article Regeneration Script
 *
 * Regenerates all 45,000+ placeholder articles using local Ollama
 * Run on your iMac with: npx ts-node scripts/regenerate-all-articles.ts
 *
 * Estimated time: ~45,000 articles × 3 seconds = ~37 hours
 * Can be stopped and resumed (processes newest first)
 */

import mysql from 'mysql2/promise';

// Configuration
const CONFIG = {
  OLLAMA_URL: process.env.OLLAMA_URL || 'http://localhost:11434',
  OLLAMA_MODEL: process.env.OLLAMA_MODEL || 'qwen2.5:14b',
  BATCH_SIZE: 100, // Articles per batch before logging progress
  DELAY_MS: 1500, // Delay between articles (1.5s)
  MAX_RETRIES: 2,
  MYSQL: {
    host: process.env.WORDPRESS_DB_HOST || '159.223.103.16',
    user: process.env.WORDPRESS_DB_USER || 'wordpress',
    password: process.env.WORDPRESS_DB_PASSWORD || '7af33f801d54a89d233370c52d532bda3f99beea2ce24d86',
    database: process.env.WORDPRESS_DB_NAME || 'wordpress_recovery',
  }
};

const PLACEHOLDER_PATTERN = 'Cet article fait partie de nos archives';

interface Article {
  ID: number;
  post_title: string;
  post_name: string;
  category_name: string | null;
}

let pool: mysql.Pool | null = null;
let stats = {
  processed: 0,
  success: 0,
  failed: 0,
  startTime: Date.now(),
};

function getPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool({
      ...CONFIG.MYSQL,
      waitForConnections: true,
      connectionLimit: 5,
      queueLimit: 0,
    });
  }
  return pool;
}

async function getPlaceholderArticles(limit: number): Promise<Article[]> {
  const db = getPool();
  const [rows] = await db.execute<any[]>(`
    SELECT
      p.ID,
      p.post_title,
      p.post_name,
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
    LIMIT ?
  `, [`%${PLACEHOLDER_PATTERN}%`, limit]);

  return rows as Article[];
}

async function getPlaceholderCount(): Promise<number> {
  const db = getPool();
  const [rows] = await db.execute<any[]>(`
    SELECT COUNT(*) as count
    FROM wp_8_posts
    WHERE post_type = 'post'
    AND post_status = 'publish'
    AND post_content LIKE ?
  `, [`%${PLACEHOLDER_PATTERN}%`]);
  return rows[0]?.count || 0;
}

async function generateContent(title: string, category: string): Promise<{ content: string; excerpt: string } | null> {
  const systemPrompt = `Tu es un journaliste sportif professionnel pour Afrique Sports.
Écris des articles factuels et engageants sur le football africain et international.
Utilise un style journalistique professionnel en français.
Structure tes articles avec 3-4 paragraphes clairs.
N'invente pas de citations fictives.`;

  const userPrompt = `Écris un article de football basé sur ce titre: "${title}"
Catégorie: ${category}

Retourne UNIQUEMENT un JSON valide:
{"content": "<p>Paragraphe 1...</p><p>Paragraphe 2...</p><p>Paragraphe 3...</p>", "excerpt": "Résumé court"}`;

  for (let attempt = 1; attempt <= CONFIG.MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 90000);

      const response = await fetch(`${CONFIG.OLLAMA_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: CONFIG.OLLAMA_MODEL,
          prompt: `${systemPrompt}\n\n${userPrompt}`,
          stream: false,
          options: { temperature: 0.7, num_predict: 1500 }
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Ollama error: ${response.status}`);
      }

      const result = await response.json();
      const jsonMatch = result.response.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        throw new Error('No JSON in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      if (parsed.content && parsed.content.length > 100) {
        return {
          content: parsed.content,
          excerpt: parsed.excerpt || parsed.content.substring(0, 150),
        };
      }

      throw new Error('Content too short');

    } catch (error: any) {
      if (attempt === CONFIG.MAX_RETRIES) {
        console.error(`  ❌ Failed after ${CONFIG.MAX_RETRIES} attempts: ${error.message}`);
        return null;
      }
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  return null;
}

async function updateArticle(articleId: number, content: string, excerpt: string): Promise<boolean> {
  const db = getPool();
  try {
    await db.execute(`
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
    console.error(`  ❌ DB update failed:`, error);
    return false;
  }
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${hours}h ${minutes}m ${secs}s`;
}

function estimateRemaining(processed: number, remaining: number, elapsedMs: number): string {
  if (processed === 0) return 'calculating...';
  const avgTimePerArticle = elapsedMs / processed;
  const remainingMs = avgTimePerArticle * remaining;
  return formatDuration(remainingMs);
}

async function processArticle(article: Article): Promise<boolean> {
  const category = article.category_name || 'football';
  const content = await generateContent(article.post_title, category);

  if (!content) {
    return false;
  }

  return await updateArticle(article.ID, content.content, content.excerpt);
}

async function main() {
  console.log('🚀 AI Article Regeneration Script');
  console.log('==================================\n');

  // Check Ollama
  try {
    const ollamaCheck = await fetch(`${CONFIG.OLLAMA_URL}/api/tags`);
    if (!ollamaCheck.ok) throw new Error('Ollama not responding');
    console.log(`✅ Ollama connected: ${CONFIG.OLLAMA_URL}`);
    console.log(`📦 Model: ${CONFIG.OLLAMA_MODEL}\n`);
  } catch (error) {
    console.error('❌ Cannot connect to Ollama. Make sure it is running.');
    console.error(`   URL: ${CONFIG.OLLAMA_URL}`);
    process.exit(1);
  }

  // Get initial count
  const totalPlaceholder = await getPlaceholderCount();
  console.log(`📊 Placeholder articles to regenerate: ${totalPlaceholder.toLocaleString()}\n`);

  if (totalPlaceholder === 0) {
    console.log('✅ All articles already regenerated!');
    process.exit(0);
  }

  stats.startTime = Date.now();

  // Process in batches
  while (true) {
    const articles = await getPlaceholderArticles(CONFIG.BATCH_SIZE);

    if (articles.length === 0) {
      console.log('\n✅ All articles regenerated!');
      break;
    }

    for (const article of articles) {
      const shortTitle = article.post_title.substring(0, 50) + (article.post_title.length > 50 ? '...' : '');
      process.stdout.write(`  [${stats.processed + 1}] ${shortTitle}`);

      const success = await processArticle(article);
      stats.processed++;

      if (success) {
        stats.success++;
        console.log(' ✅');
      } else {
        stats.failed++;
        console.log(' ❌');
      }

      // Delay between articles
      await new Promise(r => setTimeout(r, CONFIG.DELAY_MS));
    }

    // Progress report after each batch
    const remaining = await getPlaceholderCount();
    const elapsed = Date.now() - stats.startTime;
    const eta = estimateRemaining(stats.processed, remaining, elapsed);

    console.log('\n' + '─'.repeat(60));
    console.log(`📈 Progress: ${stats.success.toLocaleString()} success, ${stats.failed.toLocaleString()} failed`);
    console.log(`⏱️  Elapsed: ${formatDuration(elapsed)}`);
    console.log(`📊 Remaining: ${remaining.toLocaleString()} articles`);
    console.log(`⏳ ETA: ${eta}`);
    console.log('─'.repeat(60) + '\n');
  }

  // Final stats
  const totalTime = Date.now() - stats.startTime;
  console.log('\n' + '═'.repeat(60));
  console.log('🎉 REGENERATION COMPLETE!');
  console.log('═'.repeat(60));
  console.log(`✅ Success: ${stats.success.toLocaleString()}`);
  console.log(`❌ Failed: ${stats.failed.toLocaleString()}`);
  console.log(`⏱️  Total time: ${formatDuration(totalTime)}`);
  console.log(`📊 Rate: ${(stats.processed / (totalTime / 1000 / 60)).toFixed(1)} articles/minute`);
  console.log('═'.repeat(60) + '\n');

  await pool?.end();
  process.exit(0);
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n\n⚠️  Interrupted! Saving progress...');
  console.log(`📊 Processed: ${stats.success} success, ${stats.failed} failed`);
  await pool?.end();
  process.exit(0);
});

main().catch(console.error);
