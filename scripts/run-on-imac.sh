#!/bin/bash
# Run this script on your iMac to regenerate articles
# Usage: ./scripts/run-on-imac.sh

echo "🚀 AI Article Regeneration"
echo "=========================="
echo ""

# Check Ollama
echo "Checking Ollama..."
if ! curl -s http://localhost:11434/api/tags > /dev/null; then
    echo "❌ Ollama not running. Starting it..."
    ollama serve &
    sleep 3
fi

echo "✅ Ollama running"
echo ""

# Create temp Node.js script
cat > /tmp/regenerate.mjs << 'EOF'
import mysql from 'mysql2/promise';

const CONFIG = {
  OLLAMA_URL: "http://localhost:11434",
  OLLAMA_MODEL: "qwen2.5:14b",
  BATCH_SIZE: 50,
  DELAY_MS: 2000,
  MYSQL: {
    host: "159.223.103.16",
    user: "wordpress",
    password: "7af33f801d54a89d233370c52d532bda3f99beea2ce24d86",
    database: "wordpress_recovery",
  }
};

let stats = { success: 0, failed: 0, start: Date.now() };
let pool;

async function getPlaceholderArticles(limit) {
  const [rows] = await pool.execute(
    `SELECT ID, post_title, t.name as category
     FROM wp_8_posts p
     LEFT JOIN wp_8_term_relationships tr ON p.ID = tr.object_id
     LEFT JOIN wp_8_term_taxonomy tt ON tr.term_taxonomy_id = tt.term_taxonomy_id AND tt.taxonomy = 'category'
     LEFT JOIN wp_8_terms t ON tt.term_id = t.term_id
     WHERE p.post_type = 'post' AND p.post_status = 'publish'
     AND p.post_content LIKE '%Cet article fait partie de nos archives%'
     GROUP BY p.ID ORDER BY p.post_date DESC LIMIT ?`,
    [limit]
  );
  return rows;
}

async function generateContent(title, category) {
  const prompt = `Tu es journaliste sportif pour Afrique Sports. Ecris un article de 3-4 paragraphes sur: "${title}". Categorie: ${category || 'football'}. Retourne UNIQUEMENT un JSON: {"content": "<p>...</p><p>...</p><p>...</p>", "excerpt": "Resume"}`;

  const res = await fetch(`${CONFIG.OLLAMA_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: CONFIG.OLLAMA_MODEL, prompt, stream: false, options: { num_predict: 1200, temperature: 0.7 } }),
  });

  const result = await res.json();
  const match = result.response?.match(/\{[\s\S]*\}/);
  if (match) return JSON.parse(match[0]);
  return null;
}

async function main() {
  pool = mysql.createPool({ ...CONFIG.MYSQL, connectionLimit: 3 });

  const [countRows] = await pool.execute(
    "SELECT COUNT(*) as c FROM wp_8_posts WHERE post_content LIKE '%Cet article fait partie de nos archives%' AND post_status = 'publish'"
  );
  const total = countRows[0].c;
  console.log(`📊 Total placeholder articles: ${total.toLocaleString()}\n`);

  while (true) {
    const articles = await getPlaceholderArticles(CONFIG.BATCH_SIZE);
    if (articles.length === 0) break;

    for (const art of articles) {
      const shortTitle = art.post_title.substring(0, 45) + (art.post_title.length > 45 ? '...' : '');
      process.stdout.write(`[${stats.success + stats.failed + 1}] ${shortTitle} `);

      try {
        const content = await generateContent(art.post_title, art.category);
        if (content && content.content) {
          await pool.execute(
            "UPDATE wp_8_posts SET post_content = ?, post_excerpt = ?, post_modified = NOW() WHERE ID = ?",
            [content.content, content.excerpt || '', art.ID]
          );
          stats.success++;
          console.log('✅');
        } else {
          stats.failed++;
          console.log('❌ no content');
        }
      } catch (e) {
        stats.failed++;
        console.log('❌', e.message?.substring(0, 30));
      }

      await new Promise(r => setTimeout(r, CONFIG.DELAY_MS));
    }

    const [remaining] = await pool.execute(
      "SELECT COUNT(*) as c FROM wp_8_posts WHERE post_content LIKE '%Cet article fait partie de nos archives%' AND post_status = 'publish'"
    );
    const elapsed = (Date.now() - stats.start) / 1000;
    const rate = (stats.success + stats.failed) / elapsed * 60;
    const eta = remaining[0].c / rate;

    console.log(`\n📈 Progress: ${stats.success} success, ${stats.failed} failed | Remaining: ${remaining[0].c.toLocaleString()} | ETA: ${Math.round(eta)} min\n`);
  }

  console.log(`\n✅ Done! ${stats.success} regenerated, ${stats.failed} failed`);
  await pool.end();
}

main().catch(console.error);
EOF

# Install mysql2 if needed
if ! npm list mysql2 2>/dev/null | grep -q mysql2; then
    echo "Installing mysql2..."
    npm install mysql2
fi

# Run the script
echo "Starting regeneration..."
echo ""
node /tmp/regenerate.mjs
