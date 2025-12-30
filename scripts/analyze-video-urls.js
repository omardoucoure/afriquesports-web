#!/usr/bin/env node
/**
 * Analyze Video URLs from PostHog/Google Search Console
 * Identifies and fixes malformed URLs in video indexing data
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Analyzing Video URLs\n');

// Read the CSV file
const csvPath = process.argv[2] || '/Users/omardoucoure/Downloads/posthog-video-data/Tableau.csv';

if (!fs.existsSync(csvPath)) {
  console.error(`❌ File not found: ${csvPath}`);
  process.exit(1);
}

const csvContent = fs.readFileSync(csvPath, 'utf-8');
const lines = csvContent.split('\n').filter(line => line.trim());

console.log(`📊 Total entries: ${lines.length - 1}\n`);

// Skip header
const entries = lines.slice(1).map((line, index) => {
  const [pageUrl, videoUrl, lastCrawl] = line.split(',');
  return { index: index + 1, pageUrl, videoUrl, lastCrawl };
});

// Analysis
const analysis = {
  total: entries.length,
  malformed: [],
  valid: [],
  videoTypes: {
    youtube: 0,
    selfHosted: 0,
    other: 0,
  },
  languages: {
    fr: 0,
    en: 0,
    es: 0,
    ar: 0,
  },
};

// Patterns
const malformedPatterns = [
  { name: 'Locale + https:/', regex: /net\/([a-z]{2})\/https:\/(.+)$/, type: 'locale_malformed' },
  { name: 'No locale + https:/', regex: /net\/https:\/(.+)$/, type: 'no_locale_malformed' },
];

entries.forEach((entry) => {
  const { pageUrl, videoUrl } = entry;

  // Check for malformed URLs
  let isMalformed = false;
  let fixedUrl = null;
  let malformedType = null;

  for (const pattern of malformedPatterns) {
    const match = pageUrl.match(pattern.regex);
    if (match) {
      isMalformed = true;
      malformedType = pattern.type;

      // Fix the URL
      if (pattern.type === 'locale_malformed') {
        const locale = match[1];
        const slug = match[2];
        // Assume 'football' category for most articles (can be improved)
        fixedUrl = `https://www.afriquesports.net/${locale}/football/${slug}`;
      } else if (pattern.type === 'no_locale_malformed') {
        const slug = match[1];
        fixedUrl = `https://www.afriquesports.net/football/${slug}`;
      }

      analysis.malformed.push({
        ...entry,
        malformedType,
        fixedUrl,
      });
      break;
    }
  }

  if (!isMalformed) {
    analysis.valid.push(entry);
  }

  // Analyze video types
  if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
    analysis.videoTypes.youtube++;
  } else if (videoUrl.includes('afriquesports.net') || videoUrl.includes('realdemadrid.com/afriquesports')) {
    analysis.videoTypes.selfHosted++;
  } else {
    analysis.videoTypes.other++;
  }

  // Analyze languages
  if (pageUrl.includes('/en/')) {
    analysis.languages.en++;
  } else if (pageUrl.includes('/es/')) {
    analysis.languages.es++;
  } else if (pageUrl.includes('/ar/')) {
    analysis.languages.ar++;
  } else {
    analysis.languages.fr++;
  }
});

// Print Results
console.log('══════════════════════════════════════════════════════');
console.log('📈 Analysis Results');
console.log('══════════════════════════════════════════════════════\n');

console.log(`Total URLs: ${analysis.total}`);
console.log(`✅ Valid URLs: ${analysis.valid.length} (${((analysis.valid.length / analysis.total) * 100).toFixed(1)}%)`);
console.log(`❌ Malformed URLs: ${analysis.malformed.length} (${((analysis.malformed.length / analysis.total) * 100).toFixed(1)}%)\n`);

console.log('Video Types:');
console.log(`  📺 YouTube: ${analysis.videoTypes.youtube} (${((analysis.videoTypes.youtube / analysis.total) * 100).toFixed(1)}%)`);
console.log(`  🎬 Self-hosted: ${analysis.videoTypes.selfHosted} (${((analysis.videoTypes.selfHosted / analysis.total) * 100).toFixed(1)}%)`);
console.log(`  🔗 Other: ${analysis.videoTypes.other}\n`);

console.log('Languages:');
console.log(`  🇫🇷 French: ${analysis.languages.fr}`);
console.log(`  🇬🇧 English: ${analysis.languages.en}`);
console.log(`  🇪🇸 Spanish: ${analysis.languages.es}`);
console.log(`  🇸🇦 Arabic: ${analysis.languages.ar}\n`);

// Malformed URLs breakdown
if (analysis.malformed.length > 0) {
  console.log('══════════════════════════════════════════════════════');
  console.log('🔧 Malformed URLs Details');
  console.log('══════════════════════════════════════════════════════\n');

  const byType = analysis.malformed.reduce((acc, item) => {
    acc[item.malformedType] = (acc[item.malformedType] || 0) + 1;
    return acc;
  }, {});

  console.log('By Type:');
  Object.entries(byType).forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`);
  });

  console.log('\nFirst 10 malformed URLs:\n');
  analysis.malformed.slice(0, 10).forEach((item, i) => {
    console.log(`${i + 1}. Original: ${item.pageUrl}`);
    console.log(`   Fixed:    ${item.fixedUrl}\n`);
  });
}

// Save results
const outputDir = path.join(path.dirname(csvPath), 'analysis');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Save malformed URLs
const malformedCsv = [
  'Original URL,Fixed URL,Video URL,Type',
  ...analysis.malformed.map(item =>
    `"${item.pageUrl}","${item.fixedUrl}","${item.videoUrl}","${item.malformedType}"`
  ),
].join('\n');

fs.writeFileSync(path.join(outputDir, 'malformed-urls.csv'), malformedCsv);

// Save valid URLs
const validCsv = [
  'Page URL,Video URL,Last Crawl',
  ...analysis.valid.map(item => `"${item.pageUrl}","${item.videoUrl}","${item.lastCrawl}"`),
].join('\n');

fs.writeFileSync(path.join(outputDir, 'valid-urls.csv'), validCsv);

// Save fixed URLs (all URLs with fixes applied)
const fixedCsv = [
  'Page URL,Video URL,Last Crawl,Fixed',
  ...entries.map(item => {
    const malformed = analysis.malformed.find(m => m.index === item.index);
    const url = malformed ? malformed.fixedUrl : item.pageUrl;
    const fixed = malformed ? 'YES' : 'NO';
    return `"${url}","${item.videoUrl}","${item.lastCrawl}","${fixed}"`;
  }),
].join('\n');

fs.writeFileSync(path.join(outputDir, 'all-urls-fixed.csv'), fixedCsv);

// Save JSON analysis
fs.writeFileSync(
  path.join(outputDir, 'analysis.json'),
  JSON.stringify(
    {
      summary: {
        total: analysis.total,
        valid: analysis.valid.length,
        malformed: analysis.malformed.length,
        videoTypes: analysis.videoTypes,
        languages: analysis.languages,
      },
      malformedUrls: analysis.malformed,
    },
    null,
    2
  )
);

console.log('══════════════════════════════════════════════════════');
console.log('💾 Files Saved');
console.log('══════════════════════════════════════════════════════\n');

console.log(`📁 Output directory: ${outputDir}\n`);
console.log('Files created:');
console.log('  ✓ malformed-urls.csv - List of URLs that need fixing');
console.log('  ✓ valid-urls.csv - List of valid URLs');
console.log('  ✓ all-urls-fixed.csv - All URLs with fixes applied');
console.log('  ✓ analysis.json - Full analysis in JSON format\n');

console.log('✅ Analysis complete!\n');
