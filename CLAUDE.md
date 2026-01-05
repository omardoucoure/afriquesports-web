# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Afrique Sports - African sports news platform rebuilt with Next.js. Original site: https://www.afriquesports.net/

**Location:** Dakar, Sénégal | **Phone:** +221 77 868 32 00

⚠️ **CRITICAL: This is an SEO migration** - The site has significant Google News traffic. All URL structures must be preserved exactly.

## Commands

```bash
npm run dev      # Start development server (http://localhost:3000)
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Database migrations

**CRITICAL: Always use Supabase CLI for database migrations and schema updates**

When you need to run database migrations or schema updates:

1. **Install Supabase CLI** (if not installed):
   ```bash
   brew install supabase/tap/supabase
   ```

2. **Apply migrations using Node.js with pg package**:
   ```bash
   # Create a script to apply migration directly
   node apply_migration.js
   ```

   Example script:
   ```javascript
   const { Client } = require('pg');
   const fs = require('fs');
   require('dotenv').config({ path: '.env.local' });

   const client = new Client({
     connectionString: process.env.POSTGRES_URL_NON_POOLING
   });

   async function applyMigration() {
     await client.connect();
     const sql = fs.readFileSync('supabase/migrations/XXX_migration.sql', 'utf8');
     await client.query(sql);
     await client.end();
   }

   applyMigration();
   ```

3. **Run with:**
   ```bash
   NODE_TLS_REJECT_UNAUTHORIZED=0 node apply_migration.js
   ```

**Never:**
- ❌ Use psql directly (not installed on macOS by default)
- ❌ Use Supabase JS client for DDL operations (doesn't support ALTER TABLE)
- ❌ Try to execute DDL via REST API (not supported)

**Always:**
- ✅ Use Node.js with `pg` package and `POSTGRES_URL_NON_POOLING`
- ✅ Set `NODE_TLS_REJECT_UNAUTHORIZED=0` for Supabase connections
- ✅ Verify migrations after applying them

## Tech stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **i18n:** next-intl (French, English, Spanish)
- **Deployment:** DigitalOcean VPS with PM2

## WordPress source configuration

- **Server:** LiteSpeed on DigitalOcean (159.223.103.16)
- **CMS:** WordPress Multisite
- **Database:** MySQL (wordpress/mod849_)
- **Caching:** WP Rocket + LiteSpeed Cache
- **SEO Plugin:** Rank Math Pro
- **Theme:** JNews / Newspaper

### Key WordPress plugins to replicate functionality
- Rank Math SEO Pro (sitemaps, schema, meta)
- Web Stories (Google Web Stories)
- WonderPush (push notifications)
- Actirise (advertising)
- WordPress Popular Posts
- Permalink Manager Pro
- Redirection (301 redirects)

## SEO critical - URL structure (MUST PRESERVE)

### Permalink pattern
```
/{category}/{article-slug}
```

### Main categories (French)
- /afrique/ - African football
- /europe/ - European football
- /football/ - General football
- /mercato/ - Transfer news
- /can-2025/ - CAN 2025 coverage
- /coupe-du-monde/ - World Cup
- /autres/ - Other sports
- /ballon-dor/ - Ballon d'Or

### Country subcategories
- /afrique/senegal/
- /afrique/cameroun/
- /afrique/cote-divoire/
- /afrique/algerie/
- /afrique/maroc/
- /afrique/rdc/

### English version
- /en/{category}/{slug}
- /en/category/africa/
- /en/category/afrique/nigeria/

### Special sections
- /category/youtube/ - Video content
- /category/afrique-sports-tv/ - TV content
- /web-stories/ - Google Web Stories
- /category/article-du-jour/ - Featured articles

### Static pages
- /contact
- /confidentialite
- /live
- /stories

## Top traffic sources (preserve these URLs)

### Top countries by traffic
1. France (256 clicks)
2. Algérie (24 clicks)
3. Sénégal (20 clicks)
4. Maroc (20 clicks)
5. Côte d'Ivoire (9 clicks)
6. Cameroun (8 clicks)

### Sitemaps to generate
- /sitemap_index.xml
- /post-sitemap{1-135}.xml
- /page-sitemap.xml
- /category-sitemap.xml
- /news-sitemap.xml (Google News)
- /video-sitemap{1-7}.xml

## Key features to implement

1. Article grid with lazy-loading images
2. Featured carousel on homepage
3. "Most read" section (WordPress Popular Posts equivalent)
4. Category/country filtering
5. Search functionality
6. YouTube video embeds
7. Web stories support
8. Rankings/standings display
9. Player profiles spotlight (Osimhen, Mané, Salah, Koulibaly, Mahrez)
10. Push notifications (WonderPush)
11. Cookie consent (GDPR - FAST_CMP)
12. Ad placements (Actirise)
13. 301 redirects for any changed URLs

## Integrations

- Google Analytics: G-0DFBHGV182
- Google News Publisher
- Social: Facebook, Twitter, TikTok, Instagram, YouTube, Google News
- Ads: Actirise
- Push: WonderPush

## Workflow requirements

**Before writing any code:**
1. Summarize understanding of the task
2. Break down implementation into steps
3. Wait for user confirmation before proceeding

## Internationalization

- Never hardcode text - use localization keys
- All user-facing text must support: French (primary), English, Spanish
- Ensure all views are responsive

## Git configuration

- Use oxmo88@gmail.com for git commits
- Never run `git push` without explicit user permission
- Always ask "Should I deploy/push?" before pushing

## Code style

- Use sentence case (avoid capitalizing each word)
- Mobile-first responsive design
- Follow Next.js App Router conventions

## Design system (MOBILE-FIRST)

⚠️ **Most traffic comes from mobile** - Design mobile-first, then scale up.

### Color palette
```css
--primary: #9DFF20;        /* Lime green - accent */
--primary-dark: #345C00;   /* Dark green */
--background: #F6F6F6;     /* Light gray */
--surface: #FFFFFF;        /* White cards */
--text-primary: #303030;   /* Dark text */
--text-secondary: #666666; /* Muted text */
--black: #000000;
```

### Typography
- **Font family:** "Plus Jakarta Sans", system-ui, sans-serif
- **Font weights:** 300 (light), 400 (regular), 500 (medium), 600 (semibold), 700 (bold)
- **Headings:** Plus Jakarta Sans Bold/Semibold
- **Body:** Plus Jakarta Sans Regular (400)
- **Source:** Google Fonts - https://fonts.google.com/specimen/Plus+Jakarta+Sans

### Breakpoints
```css
--mobile: 0-767px      /* 1 column grid */
--tablet: 768-1023px   /* 2 column grid */
--desktop: 1024px+     /* 3 column grid */
```

### Spacing
- Block gap: 1.5rem (24px)
- Card padding: 15px
- Container max-width: 1200px

### Image sizes
| Context | Dimensions | Aspect ratio |
|---------|------------|--------------|
| Article card | 700x394 | 16:9 |
| Featured image | 1200x628 | ~2:1 |
| Thumbnail small | 200x105 | ~2:1 |
| Player avatar | 80x80 | 1:1 |

## Page templates

### 1. Homepage
```
┌─────────────────────────────────────┐
│ Header (logo + hamburger mobile)    │
├─────────────────────────────────────┤
│ Navigation bar (horizontal scroll)  │
├─────────────────────────────────────┤
│ Featured article (large card)       │
├─────────────────────────────────────┤
│ Article grid (1/2/3 cols)           │
│ ┌─────┐ ┌─────┐ ┌─────┐            │
│ │     │ │     │ │     │            │
│ └─────┘ └─────┘ └─────┘            │
├─────────────────────────────────────┤
│ "Les plus lus" (most read)          │
├─────────────────────────────────────┤
│ Rankings widget                     │
├─────────────────────────────────────┤
│ Footer (social + links)             │
└─────────────────────────────────────┘
```

### 2. Category page
```
┌─────────────────────────────────────┐
│ Header                              │
├─────────────────────────────────────┤
│ Breadcrumb: Home > Category         │
├─────────────────────────────────────┤
│ Category title (h1)                 │
├─────────────────────────────────────┤
│ Article grid (40 per page)          │
├─────────────────────────────────────┤
│ Pagination                          │
├─────────────────────────────────────┤
│ Footer                              │
└─────────────────────────────────────┘
```

### 3. Article detail page
```
┌─────────────────────────────────────┐
│ Header                              │
├─────────────────────────────────────┤
│ Breadcrumb: Home > Category > Title │
├─────────────────────────────────────┤
│ Article title (h1)                  │
│ Author + Date                       │
├─────────────────────────────────────┤
│ Featured image (1200x628)           │
├─────────────────────────────────────┤
│ Article content                     │
│ - Paragraphs                        │
│ - Embedded videos                   │
│ - Poll widget                       │
├─────────────────────────────────────┤
│ Social sharing buttons              │
├─────────────────────────────────────┤
│ Related articles                    │
├─────────────────────────────────────┤
│ Comments section                    │
├─────────────────────────────────────┤
│ Sidebar (desktop only):             │
│ - Rankings                          │
│ - Key players                       │
│ - Latest articles                   │
├─────────────────────────────────────┤
│ Footer                              │
└─────────────────────────────────────┘
```

## Components to build

### Header
- Logo (left)
- Hamburger menu (mobile)
- Search icon
- Horizontal scroll nav on mobile

### Article card
- Thumbnail image (lazy load)
- Category badge (colored)
- Title (2-3 lines max, truncate)
- Date
- Hover: slight shadow lift

### Sidebar widgets
- Classements (Rankings table)
- Joueurs clés (Player cards)
- Derniers articles (Recent posts list)
- Social follow buttons

### Footer
- Social links row
- Player profiles links
- Legal links (Privacy, Contact)
- Copyright

## Ad placements
- Top of content (leaderboard)
- In-article (after 2nd paragraph)
- Sidebar (desktop)
- Interstitial (mobile, on page load)

## SEO critical issues to fix

### Current indexing problems (from Google Search Console)
- **1.14 million non-indexed URLs** vs 356k indexed
- **9,287 videos missing thumbnail URLs**
- **3,820 videos not on dedicated video pages**

### Fixes required in Next.js
1. Implement proper canonical URLs on all pages
2. Add noindex to pagination pages beyond page 1
3. Consolidate duplicate content (category vs tag pages)
4. Proper hreflang implementation for FR/EN
5. Video pages must have dedicated URLs with schema

## Google Discover optimization

⚠️ **Priority: Regain Google Discover traffic**

### Best practices to implement
1. **High-quality images** - Min 1200px wide, use max-image-preview:large
2. **Compelling headlines** - Avoid clickbait, be informative
3. **E-E-A-T signals** - Author bios, publish dates, sources
4. **Fresh content** - Publish consistently, update old articles
5. **Mobile-first** - Perfect Core Web Vitals scores
6. **Structured data** - NewsArticle, Article, VideoObject schemas
7. **Large featured images** - 16:9 or 4:3 aspect ratio

### Required meta tags for Discover
```html
<meta name="robots" content="max-image-preview:large">
<meta property="og:image" content="[1200x630 image]">
<meta property="article:published_time" content="[ISO date]">
<meta property="article:author" content="[Author name]">
```

## Core Web Vitals targets

| Metric | Target | How to achieve |
|--------|--------|----------------|
| LCP | < 2.5s | next/image, preload fonts, edge caching |
| FID | < 100ms | Minimal JS, code splitting |
| CLS | < 0.1 | Image dimensions, font-display: swap |
| INP | < 200ms | React 18 concurrent features |

## SEO checklist for every page

- [ ] Unique title tag (50-60 chars)
- [ ] Meta description (150-160 chars)
- [ ] Canonical URL
- [ ] Open Graph tags (og:title, og:description, og:image)
- [ ] Twitter Card tags
- [ ] Structured data (JSON-LD)
- [ ] Breadcrumb schema
- [ ] Proper heading hierarchy (single H1)
- [ ] Alt text on all images
- [ ] Internal linking
- [ ] Mobile responsive
- [ ] Fast loading (< 3s)
