# Video Tracking and URL Fix Guide

## Overview

This guide covers:
1. Analyzing and fixing malformed video URLs from Google Search Console
2. Importing video data into PostHog for analytics tracking

## Analysis Results

### URL Analysis Summary

**From 1,000 video entries:**
- ✅ **Valid URLs**: 904 (90.4%)
- ❌ **Malformed URLs**: 96 (9.6%)
  - With locale prefix: 74 (`/en/https:/`, `/es/https:/`, etc.)
  - Without locale: 22 (`/https:/`)

### Video Distribution

**By Type:**
- 📺 YouTube embeds: 656 (65.6%)
- 🎬 Self-hosted videos: 304 (30.4%)
- 🔗 Other sources: 40 (4.0%)

**By Language:**
- 🇫🇷 French: 358
- 🇬🇧 English: 221
- 🇪🇸 Spanish: 226
- 🇸🇦 Arabic: 195

## URL Malformation Patterns

### Pattern 1: Locale + https:/
```
❌ Bad:  https://www.afriquesports.net/en/https:/article-slug
✅ Fixed: https://www.afriquesports.net/en/football/article-slug
```

### Pattern 2: No Locale + https:/
```
❌ Bad:  https://www.afriquesports.net/https:/article-slug
✅ Fixed: https://www.afriquesports.net/football/article-slug
```

## Scripts Available

### 1. analyze-video-urls.js

Analyzes video URLs and identifies issues.

**Usage:**
```bash
node scripts/analyze-video-urls.js [path-to-csv]

# Default path if not specified:
# /Users/omardoucoure/Downloads/posthog-video-data/Tableau.csv
```

**Output Files:**
- `analysis/malformed-urls.csv` - URLs that need fixing
- `analysis/valid-urls.csv` - Valid URLs
- `analysis/all-urls-fixed.csv` - All URLs with fixes applied
- `analysis/analysis.json` - Full analysis in JSON format

**Example:**
```bash
cd /Users/omardoucoure/Documents/Afrique\ Sports/afriquesports-web

node scripts/analyze-video-urls.js /Users/omardoucoure/Downloads/posthog-video-data/Tableau.csv
```

### 2. import-videos-to-posthog.js

Imports video data to PostHog as `Video_Impression` events.

**Usage:**
```bash
node scripts/import-videos-to-posthog.js [path-to-fixed-csv]

# Default path if not specified:
# /Users/omardoucoure/Downloads/posthog-video-data/analysis/all-urls-fixed.csv
```

**Features:**
- Sends events in batches of 100
- 1-second delay between batches to avoid rate limiting
- Automatically detects video type (YouTube, self-hosted, other)
- Extracts locale and category from URL
- Marks URLs that were fixed
- Creates detailed import log

**Example:**
```bash
cd /Users/omardoucoure/Documents/Afrique\ Sports/afriquesports-web

# First, analyze the URLs
node scripts/analyze-video-urls.js

# Then, import to PostHog
node scripts/import-videos-to-posthog.js
```

## PostHog Video Event Schema

### Video_Impression Event

Sent when a video is discovered/indexed.

**Properties:**
```typescript
{
  event: "Video_Impression",
  properties: {
    distinct_id: string,           // Unique identifier
    video_url: string,              // Video embed URL
    video_type: "youtube" | "self_hosted" | "other",
    article_url: string,            // Page URL where video appears
    article_category: string,       // Article category (football, etc.)
    article_slug: string,           // Article slug
    video_position: "embedded",     // Position in article
    locale: "fr" | "en" | "es" | "ar",
    page_path: string,              // URL path
    timestamp: number,              // Event timestamp
    session_id: string,             // Session identifier
    source: "google_search_console",
    was_url_fixed: boolean,         // Whether URL was malformed and fixed
  }
}
```

### Other Video Events (Future Use)

Additional events are defined for real-time video tracking:

- `Video_Play` - User starts playing video
- `Video_Progress_25/50/75/100` - Playback progress milestones
- `Video_Complete` - Video playback completed
- `Video_Pause` - User pauses video
- `Video_Seek` - User seeks to different position

## Querying Video Data in PostHog

### View All Video Impressions

1. Go to: https://us.posthog.com/project/21827/events
2. Filter by event name: `Video_Impression`
3. View properties breakdown

### Create Video Analytics Dashboard

**Useful Insights:**

1. **Videos by Type**
   - Event: `Video_Impression`
   - Breakdown by: `video_type`
   - Shows: YouTube vs Self-hosted distribution

2. **Videos by Category**
   - Event: `Video_Impression`
   - Breakdown by: `article_category`
   - Shows: Which categories have most videos

3. **Videos by Language**
   - Event: `Video_Impression`
   - Breakdown by: `locale`
   - Shows: Content distribution across languages

4. **URL Fix Rate**
   - Event: `Video_Impression`
   - Breakdown by: `was_url_fixed`
   - Shows: How many URLs were malformed

## Using the /api/posthog-stats Endpoint

You can query video data through the existing API:

```bash
# Get video stats for the week
curl https://www.afriquesports.net/api/posthog-stats?period=week

# Filter by video events (requires API enhancement)
# Coming soon: filter by event type
```

## Frontend Integration

### Track Video Play Events

Add to your video player component:

```typescript
'use client'
import { useEffect, useRef } from 'react'

export function VideoPlayer({ videoUrl, articleId }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handlePlay = () => {
      if (window.posthog) {
        window.posthog.capture('Video_Play', {
          video_url: videoUrl,
          video_type: videoUrl.includes('youtube') ? 'youtube' : 'self_hosted',
          article_id: articleId,
          autoplay: false,
        })
      }
    }

    const handleProgress = () => {
      if (!video.duration) return
      const progress = (video.currentTime / video.duration) * 100

      const milestones = [25, 50, 75, 100]
      milestones.forEach(milestone => {
        if (progress >= milestone && !video.dataset[`milestone${milestone}`]) {
          video.dataset[`milestone${milestone}`] = 'true'

          if (window.posthog) {
            window.posthog.capture(`Video_Progress_${milestone}`, {
              video_url: videoUrl,
              video_type: videoUrl.includes('youtube') ? 'youtube' : 'self_hosted',
              article_id: articleId,
              progress_percentage: milestone,
              current_time_seconds: video.currentTime,
              total_duration_seconds: video.duration,
            })
          }
        }
      })
    }

    video.addEventListener('play', handlePlay)
    video.addEventListener('timeupdate', handleProgress)

    return () => {
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('timeupdate', handleProgress)
    }
  }, [videoUrl, articleId])

  return <video ref={videoRef} src={videoUrl} controls />
}
```

## Workflow Summary

### Step 1: Export from Google Search Console

1. Go to Google Search Console
2. Navigate to: Performance → Video Indexing
3. Export data as CSV
4. Download to `/Users/omardoucoure/Downloads/`

### Step 2: Analyze URLs

```bash
cd /Users/omardoucoure/Documents/Afrique\ Sports/afriquesports-web

node scripts/analyze-video-urls.js /Users/omardoucoure/Downloads/[filename].csv
```

**Output:** Fixed URLs in `analysis/` directory

### Step 3: Import to PostHog

```bash
node scripts/import-videos-to-posthog.js
```

**Output:**
- Events sent to PostHog
- Import log in `analysis/import-log.json`

### Step 4: Verify in PostHog

1. Open: https://us.posthog.com/project/21827/events
2. Filter: `Video_Impression`
3. Check properties:
   - `video_type` breakdown
   - `article_category` breakdown
   - `was_url_fixed` values

## Troubleshooting

### Import Failed: Rate Limiting

**Solution:** The script already includes 1-second delays. If still rate-limited:
1. Edit `import-videos-to-posthog.js`
2. Increase `DELAY_BETWEEN_BATCHES` (line 9)
3. Decrease `BATCH_SIZE` (line 8)

### URLs Still Malformed

The fix assumes all articles are in `/football/` category. To improve:

1. **Option 1:** Query your database for actual categories
2. **Option 2:** Add category detection logic
3. **Option 3:** Manual review of malformed URLs CSV

### PostHog Events Not Appearing

**Check:**
1. API key is correct: `phc_Gq0AQAld7nRpXz0X8Et9CYX4abM7UP6rYYUCh5rwtqV`
2. Host is correct: `us.i.posthog.com`
3. Events may take 1-2 minutes to appear
4. Check import log for errors

## Next Steps

### 1. Fix URLs in Production

Create a script to redirect malformed URLs:

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()

  // Fix malformed URLs
  if (url.pathname.match(/\/https:\//)) {
    const fixed = url.pathname.replace(/\/https:\//, '/football/')
    url.pathname = fixed
    return NextResponse.redirect(url, 301)
  }

  return NextResponse.next()
}
```

### 2. Real-time Video Tracking

Implement video player event tracking as shown in Frontend Integration section.

### 3. Video Analytics Dashboard

Create a dedicated dashboard showing:
- Most watched videos
- Video completion rates
- Videos by category/language
- YouTube vs self-hosted performance

### 4. Video SEO Optimization

Use the analyzed data to:
- Update video sitemaps
- Fix broken video embeds
- Optimize video metadata
- Improve video thumbnails

## Files Created

- ✅ `scripts/analyze-video-urls.js` - URL analysis tool
- ✅ `scripts/import-videos-to-posthog.js` - PostHog import tool
- ✅ `src/lib/analytics/events.ts` - Updated with video event types
- ✅ `VIDEO-TRACKING-GUIDE.md` - This documentation
